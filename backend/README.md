# Maintenance API

REST API for managing the maintenance of a naval fleet, built with hexagonal architecture (Hexagonal Architecture / DDD) on AWS Lambda with Serverless Framework.

---

## Technologies

| Category | Technology |
|---|---|
| Runtime | Node.js 24.x (Lambda runtime `nodejs24.x`) |
| Language | TypeScript 5.3 |
| IoC Framework | NestJS 10 |
| Lambda Handler | Middy 4 |
| Deployment | Serverless Framework 4 |
| Local execution | serverless-offline 14 |
| Database | PostgreSQL 15 |
| ORM | Native `pg` driver (parameterized queries) |
| Authentication | JWT (HS256) via `jsonwebtoken` |
| Password hashing | bcrypt (10 rounds) |
| Input validation | Joi 17 |
| AI / LLM | Groq SDK (`llama-3.3-70b-versatile`) |
| Tests | Jest 29 + jest-cucumber (BDD) |
| Local infrastructure | Docker + Docker Compose |

---

## Prerequisites

- **Docker** and **Docker Compose** (to run the whole application locally)
- **Node.js** 24.x and **pnpm** 10 (`packageManager: pnpm@10.33.0`) — only to run the tests or to develop locally without Docker

---

## Running the Project Locally (Docker — recommended)

The project is fully dockerized. Both the PostgreSQL database and the API run as containers orchestrated by Docker Compose.

### 1. Start the whole stack

```bash
docker-compose up -d
```

or, using the pnpm script:

```bash
pnpm run docker:up
```

This command starts two containers:
- **`mtto-db`** — PostgreSQL 15, with schema and seed (passwords already bcrypt-hashed) initialized automatically by `init.sql`
- **`mtto-app`** — Node.js 24 API, compiled with `swc` and bundled with esbuild, started with `serverless offline` listening on `0.0.0.0:3000`

The server will be available at `http://localhost:3000`. The stage prefix is `/DESA`.

Database connection (for external clients, e.g. DBeaver):
- Host: `localhost`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: `postgres`

> **Security note:** the `backend/.env` file is listed in `.gitignore` and is not versioned. Before starting the containers, create it with the following content (replace the `GROQ_API_KEY` value with your own key):
> ```
> POSTGRESQL_CREDENTIALS='{"host":"postgres","port":5432,"database":"postgres","user":"postgres","password":"postgres","max":10,"idleTimeoutMillis":30000,"connectionTimeoutMillis":2000}'
> JWT_SECRET='<secure-jwt-secret>'
> GROQ_API_KEY='<your-groq-api-key>'
> SERVERLESS_ACCESS_KEY='<serverless-v4-access-key>'   # required to deploy with Serverless Framework v4
> ```

### 2. Check the container status

```bash
docker-compose ps
```

To follow the application logs in real time:

```bash
pnpm run docker:logs
# or
docker-compose logs -f app
```

### 3. Rebuild the image after code changes

```bash
pnpm run docker:rebuild
# or
docker-compose up -d --build
```

### 4. Stop and remove the containers

```bash
pnpm run docker:down
# or
docker-compose down
```

---

## Running the Project Locally (without Docker)

> Requires Node.js 24.x, pnpm 10 and a reachable PostgreSQL instance.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the local server

```bash
pnpm start
```

The server will start on `http://localhost:3001` with stage `/DESA`.

### 3. Run the tests

```bash
pnpm test
```

The tests are written in BDD style with jest-cucumber and cover the main use cases of the `maintenances` module.

---

## Available pnpm Scripts

| Script | Description |
|---|---|
| `pnpm start` | Starts the local server with serverless-offline (port 3001) |
| `pnpm run start:docker` | Runs the compiled app inside the Docker container (`node dist/...`) |
| `pnpm test` | Runs the tests with coverage |
| `pnpm run build` | Type-checks and compiles TypeScript → `dist/` |
| `pnpm run bundle` | Bundles `dist/` into `dist-bundle/` with esbuild (`--target=node24`, minified, ESM) |
| `pnpm run lint` | Runs ESLint static analysis on `src/` |
| `pnpm run docker:up` | Starts all containers (`docker-compose up -d`) |
| `pnpm run docker:down` | Stops and removes the containers |
| `pnpm run docker:rebuild` | Rebuilds the image and restarts the containers |
| `pnpm run docker:restart` | Restarts only the `app` container |
| `pnpm run docker:logs` | Follows the `app` container logs |
| `pnpm run docker:build` | Builds the Docker image locally |
| `pnpm run docker:clean` | Stops the containers and removes the volumes (`down -v`) |
| `pnpm run sls-deploy` | Deploys to AWS: build (swc) + esbuild bundle + `serverless deploy --stage DESA --region us-east-1` |

---

## Test Credentials

The following credentials are created automatically by `init.sql` on the first container start:

| Username | Password (clear text) | Customer | Role |
|---|---|---|---|
| `user1` | `hash1` | Cliente 1 Relacional | admin |
| `user2` | `hash2` | Cliente 2 Relacional | technician |
| `user3` | `hash3` | Cliente 3 Relacional | operator |

> **Note:** `init.sql` inserts the passwords already as bcrypt hashes (`$2b$10$...`). No migration is required on first start. The strings `hash1`, `hash2`, `hash3` are the clear-text passwords to use at login; verification happens via `bcrypt.compare`.

### Obtaining a JWT

```bash
POST http://localhost:3000/DESA/V1/auth/login
Content-Type: application/json

{
  "username": "user1",
  "password": "hash1"
}
```

Response:
```json
{
  "token": "<JWT_TOKEN>"
}
```

Use the token as the `Authorization: Bearer <JWT_TOKEN>` header on all protected requests.

---

## API Endpoints

| Method | Path | Description | Auth required |
|---|---|---|---|
| `POST` | `/DESA/V1/auth/login` | Login, returns JWT | No |
| `GET` | `/DESA/V1/vessels` | Tenant vessels list | Yes |
| `GET` | `/DESA/V1/vessels/{id}/components` | Vessel components | Yes |
| `POST` | `/DESA/V1/components/{id}/maintenance` | Create maintenance | Yes |
| `GET` | `/DESA/V1/maintenance` | Tenant maintenance list | Yes |
| `PATCH` | `/DESA/V1/maintenance/{id}` | Update maintenance status | Yes |
| `DELETE` | `/DESA/V1/maintenance/{id}` | Delete maintenance | Yes |
| `POST` | `/DESA/V1/maintenance/query-ai` | Natural-language AI query | Yes |
| `GET` | `/DESA/V1/maintenance/ai-health` | LLM provider health check | Yes |
| `GET` | `/DESA/swagger` | Swagger UI documentation | No |

---

## Deployment Notes

- **Serverless Framework v4** authenticates on **every command** via `SERVERLESS_ACCESS_KEY` (set in `backend/.env`) or `serverless login`.
- Lambda runtime is **nodejs24.x** (arm64, `architecture: arm64`) with **timeout 29s** — the maximum for REST API Gateway v1 integration (the `swagger`/`swaggerJson` functions use 10s).
- Packaging is **per function** (`package.individually: true`): the `swagger` and `swaggerJson` deployment artifacts are slimmed to **~70 KB** (only `SwaggerHandler.js` + `openapi.json` + `package.json`), excluding `App.js`, shared chunks, the Groq SDK and the `bcrypt`/`node-gyp-build` modules that only `maintenanceAPI` needs.

---

## Project Structure

```
maintenance-api-impl-v1/
├── src/
│   ├── common/                         # Shared code (cross-cutting)
│   │   ├── ai/                         # LLMProvider, GroqLLMProvider, AIPromptBuilder
│   │   ├── application/
│   │   │   ├── dto/                    # RequestDto, ResponseDto
│   │   │   ├── exception/              # CustomException, AppException, ErrorConstants
│   │   │   ├── validation/             # UUIDValidator, ValidationMessages
│   │   │   └── validationSchemas/      # Shared Joi schemas
│   │   ├── constants/                  # HttpConstants, AIConstants
│   │   ├── db/                         # PostgreSQLConnection, helpers
│   │   ├── infrastructure/
│   │   │   ├── middleware/             # TenantValidator, TenantValidationGuard,
│   │   │   │                           # RequireTenant decorator, TenantInterceptor
│   │   │   └── swagger/                # SwaggerHandler
│   │   └── util/                       # Util, NumberUtil, GeneratorExcelUtil
│   │
│   └── maintenances/                   # Main module (Hexagonal DDD)
│       ├── application/
│       │   ├── ai/                     # AIMaintenanceService, AI DTOs
│       │   ├── dto/
│       │   │   └── request/            # CreateMaintenanceRequest, UpdateMaintenanceRequest,
│       │   │                           # LoginRequest
│       │   ├── service/                # MaintenanceApplicationService
│       │   └── validation/             # MaintenanceRequestValidation
│       ├── domain/
│       │   ├── entities/               # Maintenance, Customer, User, Vessel, Component
│       │   ├── repository/             # Repository interfaces (ports)
│       │   └── service/                # MaintenanceDomainService
│       └── infrastructure/
│           ├── bootstrap/              # App.ts (Lambda handler), AppModule, HandleCore
│           ├── controller/             # MaintenanceController, AuthController,
│           │                           # VesselController, AIQueryController, MaintenanceModule
│           └── repository/             # MaintenancePostgreRepository (PostgreSQL adapter)
│
├── test/                               # BDD tests (jest-cucumber)
│   ├── common/application/
│   ├── features/maintenances/          # .feature files (Gherkin)
│   └── maintenances/application/       # Step definitions
│
├── config/
│   └── serverless/                     # VTL templates, HTTP configuration, functions
│       └── request/                    # Mapping template for each endpoint
│
├── scripts/
│   └── migrate-passwords-bcrypt.ts     # Password → bcrypt migration script
│
├── Dockerfile                          # Docker image for the Node.js application
├── docker-compose.yml                  # Full stack: app + PostgreSQL database
├── init.sql                            # DDL schema + sample data
├── serverless.yaml                     # Serverless Framework configuration
├── tsconfig.json                       # TypeScript configuration
├── jest.config.js                      # Jest configuration
└── package.json
```

---

## Design Assumptions

- **Multi-tenancy by `customerId`:** each user belongs to a customer (`customer`). All data (vessels, components, maintenance) is isolated by `customerId`. No user can access or modify another tenant's data.

- **Lambda-first architecture:** the project does not use a traditional HTTP server. Every request is routed by API Gateway to a single Lambda function (`maintenanceAPI`) through the `action` field injected by the VTL templates.

- **Self-signed JWT (HS256):** the JWT secret is configured as an environment variable with SSM-first precedence. Locally it falls back to `backend/.env`; in production it is read from SSM Parameter Store (`/MAINTENANCE-API/<stage>/JWT_SECRET`).

- **Lambda integration (not proxy):** API Gateway `lambda` integration is used, not `lambda-proxy`. The VTL templates in `config/serverless/request/` map the incoming payload and `response.vm` maps the HTTP status from the Lambda response.

- **No ORM:** native parameterized SQL queries are used to maximize control and prevent SQL injection.

- **Single handler for all routes:** all HTTP routes are handled by the same Lambda function (`maintenanceAPI`). `HandleCore.ts` acts as an internal router based on the action encoded in the VTL template.

- **Groq as LLM provider:** AI queries use the `llama-3.3-70b-versatile` model through Groq. Without a valid `GROQ_API_KEY`, the AI feature is unavailable.

---

## Sample Data (Seed)

The `init.sql` file automatically creates on first Docker start:

- **3 customers** (`Cliente 1 Relacional`, `Cliente 2 Relacional`, `Cliente 3 Relacional`)
- **3 users** (`user1`, `user2`, `user3`), each linked to their own customer
- **3 vessels** (`Vessel A`, `Vessel B`, `Vessel C`)
- **3 components** (`Motor Principal 1`, `Bomba Hidráulica 2`, `Generador Eléctrico 3`)
- **3 maintenances** with `scheduled`, `completed` and `in-progress` status

To re-initialize the database from scratch (also removes volumes):

```bash
pnpm run docker:clean
docker-compose up -d
```

or:

```bash
docker-compose down -v
docker-compose up -d
```

---

## Environment Variables

Runtime secrets (`POSTGRESQL_CREDENTIALS`, `JWT_SECRET`, `GROQ_API_KEY`) are resolved in
`backend/serverless.yaml` with **SSM-first precedence**, in a single line per secret:

```
${ssm:/MAINTENANCE-API/<stage>/<NAME>, env:<NAME>, '###'}
```

- **Cloud (deploy):** value is read from SSM Parameter Store.
- **Local (`serverless-offline`):** falls back to the `backend/.env` value when the SSM parameter is missing.
- **Last resort:** the `'###'` placeholder.

| Variable | Description | Notes |
|---|---|---|
| `JWT_SECRET` | JWT secret key (min 32 chars) | SSM → `env` → `'###'` |
| `JWT_AUDIENCE` | JWT audience | `maintenance-api` |
| `JWT_ISSUER` | JWT issuer | `maintenance-api-issuer` |
| `JWT_EXPIRATION` | Token duration | `24h` |
| `POSTGRESQL_CREDENTIALS` | JSON with DB credentials | SSM → `env` → `'###'` (local Docker credentials in `backend/.env`) |
| `GROQ_API_KEY` | Groq API key for LLM | SSM → `env` → `'###'` |
| `SERVERLESS_ACCESS_KEY` | Serverless Framework v4 auth | Used by the CLI at deploy time (from `backend/.env`) |
| `STAGE` | Deployment stage | `DESA` |