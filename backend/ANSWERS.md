# Project Answers — Maintenance API

## Question 1 — Scalability and AWS Architecture

Faced with a significant increase in customers, vessels and maintenance operations, the architecture must evolve from a local development environment to an enterprise-grade cloud solution (AWS). These are the key pillars:

### 1. Database Connection Management (AWS RDS Proxy)
Since the project uses **AWS Lambda**, the main scaling problem is that each instance opens a persistent connection to PostgreSQL, which can collapse the engine.
- **Solution:** Implement **RDS Proxy** to efficiently pool connections, allowing thousands of Lambdas to share a small number of DB connections, ensuring stability.

### 2. Caching and Read Layer (Amazon ElastiCache + Read Replicas)
- **Redis caching:** Consulting static or master data (vessel metadata, customers, component types) constantly hits RDS unnecessarily. I would use **Redis** to cache these responses, reducing latency from milliseconds to microseconds.
- **Read replicas:** To relieve the primary database instance, I would route all `GET` history queries to a **Read Replica**, leaving the primary instance exclusively for critical maintenance inserts and updates.

### 3. Asynchronous Processing (AWS SQS + Lambda)
Expensive operations such as massive technical documentation uploads or monthly report generation should not block the API.
- **Solution:** Introduce an event-driven architecture using **Amazon SQS**. The API receives the request, queues it and returns immediately to the user; another Lambda processes the heavy work in the background without degrading the user experience.

### 4. Production Security and Robustness
- **Network architecture (VPC):** I would isolate RDS and the Lambdas in private subnets, communicating with external services (such as S3 for technical documentation) through **VPC Endpoints** to avoid the public internet.

- **Secrets management:** a step in this direction is already implemented — the runtime secrets (`POSTGRESQL_CREDENTIALS`, `JWT_SECRET`, `GROQ_API_KEY`) are resolved from **SSM Parameter Store with an `env` (local `.env`) fallback**, using a single line per secret in `serverless.yaml`. Moving the secrets to **AWS Secrets Manager** (rotatable) remains a future improvement.

- **Local containerization (Docker + Docker Compose):** The full development environment — application and database — is orchestrated with Docker Compose. The `mtto-app` container runs `serverless offline` (Node.js 24) inside the container via `dumb-init`, while `mtto-db` starts PostgreSQL 15 with automatic seeding from `init.sql` (passwords already bcrypt-hashed, no manual migration required). The `backend/.env` file is excluded from version control (`.gitignore`) for security, following GitHub Secret Scanning recommendations. `SERVERLESS_ACCESS_KEY` (required by Serverless Framework v4 for authentication) is also kept there. This removes local Node.js dependencies and guarantees reproducible environments across developers.

---

## Question 2 — Technology Choice (FastAPI vs NestJS)

For a project of this nature (Maintenance API, PostgreSQL, JWT, Serverless deployment), these are the considerations on the two main technologies:

### NestJS (Selected Option)

**Advantages:**
- **Robust Architecture:** Its modular structure and dependency injection keep the code organized, which is vital in long-lived enterprise systems.
- **Strong Typing (TypeScript):** Provides superior safety when handling complex vessel and maintenance data, reducing runtime errors.
- **Native Documentation:** Generates OpenAPI (Swagger) specifications in an integrated way, easing frontend integration work.

**Disadvantages:**
- **Learning Curve:** It is more complex than FastAPI due to its Angular-inspired architecture (decorators, modules, DI).
- **Overhead (Boilerplate):** Requires more initial code for simple tasks compared to more straightforward frameworks.

---

### FastAPI (Python)

**Advantages:**
- **Extreme Performance:** One of the fastest frameworks for Python, with native `async/await` support.
- **Development Speed:** Allows building functional endpoints with much less code and boilerplate.
- **Cold Starts:** Being a lighter environment than Node.js + NestJS, Lambdas usually start faster.

**Disadvantages:**
- **Lack of Enforced Structure:** If the team is not disciplined, the project can easily lose architectural cohesion (become "spaghetti") by not imposing layers like NestJS.
- **Typing Ecosystem:** Although it uses Python hints, it is not as robust as the TypeScript type system in large codebases.

### Conclusion
Although **FastAPI** is an excellent option for its speed, for a **Maintenance API** that requires scalability and maintainability by multiple developers over the long term, **NestJS** is the winning choice because of the rigidity of its architecture and the security that TypeScript provides.

---

## Question 3 — AI/LLM Bonus

This functionality was developed and implemented in the project as part of the deliverable, through the endpoint `POST /DESA/V1/maintenance/query-ai`.

### LLM Configuration

| Parameter | Value |
|---|---|
| Provider | Groq |
| Model | `llama-3.3-70b-versatile` |
| Temperature | `0.3` (precise and controlled answers) |
| Max tokens | `1000` |
| Timeout per request | `30 000 ms` |
| Automatic retries | `3` attempts with `1 000 ms` wait between each |
| Rate limit (reference) | `10 req/min`, `100 req/hour` |

### Architectural Approach: Contextual LLM with real DB data

Instead of a full RAG architecture with a vector database (which would require additional infrastructure such as Pinecone or pgvector), a pragmatic **LLM with dynamic context** approach was chosen: the backend collects the customer's data from the database in real time and injects it as context to the LLM (Groq) together with the user's question.

The flow of a query is as follows:
1. The technician sends a natural-language question to the endpoint.
2. The backend extracts the `customerId` from the user's JWT.
3. The DB is queried to obtain only that customer's vessels, components and maintenances.
4. `AIPromptBuilder` formats that context (vessels, components, history) and builds the final prompt.
5. `AIConstants.getSystemPrompt()` automatically detects the language of the question (Italian or English) and selects the corresponding system prompt.
6. The LLM's response, together with the original `question`, the `timestamp` and the `processingTimeMs`, is returned to the technician.

### Multilingual Support

The system automatically detects the language of the question through keyword analysis (`AIConstants.LANGUAGE_KEYWORDS`) and selects the appropriate system prompt:
- **Italian:** enabled by keywords such as `imbarcazioni`, `manutenzione`, `cronologia`, etc.
- **English:** default language if no Italian keywords are detected.

This allows technicians from different countries to interact with the system in their native language without additional configuration.

### How the 4 pillars are guaranteed:

**Data separation between customers (Multi-tenancy)**
The `AIQueryController` extracts the `customerId` from the JWT and uses it as a mandatory filter in every database query (`gatherMaintenanceContext(customerId)`). It is architecturally impossible for a technician of one customer to receive context data from another customer.

**Access control**
Before processing any query, the controller validates that the JWT contains a valid `customerId`, returning `401 Unauthorized` if the token is missing or invalid. Access to the endpoint requires JWT authentication in all cases.

**Traceability of answers**
Each answer includes in its structure: the original `question` asked, the exact `timestamp` of the query, the `processingTimeMs` processing time, and the data source (`dataSource: "database"`). Additionally, the logger records each query with the `customerId`, allowing full auditing in CloudWatch in production.

**System reliability**
The `AIMaintenanceService` verifies that the LLM is available before processing (`llmProvider.isConfigured()`). The `GroqLLMProvider` implements an **automatic retry** mechanism (3 attempts with 1s wait) to absorb transient Groq API failures. The `system prompt` explicitly instructs the model to answer only with the provided context data, avoiding hallucinations. In case of LLM or DB errors, the system returns a controlled error response without exposing internal details to the client.

### Future improvement: full RAG architecture
To scale this functionality to extensive technical documentation (manuals, blueprints, field notes), the next step would be to introduce a **vector database** (such as `pgvector` on the existing PostgreSQL) to store document embeddings, always filtering by `client_id` as a mandatory metadata in every similarity search.