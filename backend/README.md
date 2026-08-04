# Maintenance API

REST API per la gestione della manutenzione di flotte navali, sviluppata con architettura esagonale (Hexagonal Architecture / DDD) su AWS Lambda con Serverless Framework.

---

## Tecnologie Utilizzate

| Categoria | Tecnologia |
|---|---|
| Runtime | Node.js 20.x |
| Linguaggio | TypeScript 5.3 |
| Framework IoC | NestJS 10 |
| Handler Lambda | Middy 4 |
| Deploy | Serverless Framework 3 |
| Esecuzione locale | serverless-offline 13 |
| Database | PostgreSQL 15 |
| ORM | Driver nativo `pg` (query parametriche) |
| Autenticazione | JWT (HS256) via `jsonwebtoken` |
| Hash password | bcrypt (10 rounds) |
| Validazione input | Joi 17 |
| AI / LLM | Groq SDK (`llama-3.3-70b-versatile`) |
| Test | Jest 29 + jest-cucumber (BDD) |
| Infrastruttura locale | Docker + Docker Compose |

---

## Prerequisiti

- **Docker** e **Docker Compose** (per eseguire l'intera applicazione in locale)
- **Node.js** >= 20.x e **pnpm** >= 9.x (solo per eseguire i test o sviluppare in locale senza Docker)

---

## Avviare il Progetto in Locale (Docker — raccomandato)

Il progetto è completamente dockerizzato. Sia il database PostgreSQL che l'API girano come container orchestrati da Docker Compose.

### 1. Avviare l'intera stack

```bash
docker-compose up -d
```

oppure, usando lo script pnpm:

```bash
pnpm run docker:up
```

Questo comando avvia due container:
- **`mtto-db`** — PostgreSQL 15, con schema e seed (con password già bcrypt-hashate) inizializzati automaticamente da `init.sql`
- **`mtto-app`** — API Node.js 20, compilata e avviata con `serverless offline` in ascolto su `0.0.0.0:3000`

Il server sarà disponibile su `http://localhost:3000`. Il prefisso di stage è `/DESA`.

Connessione al database (per client esterni, es. DBeaver):
- Host: `localhost`
- Porta: `5432`
- Database: `postgres`
- Utente: `postgres`
- Password: `postgres`

> **Nota sicurezza:** il file `docker.env` è elencato nel `.gitignore` e non viene versionato. Prima di avviare i container, crearlo nella root del progetto con il seguente contenuto (sostituire il valore di `GROQ_API_KEY` con la propria chiave):
> ```
> POSTGRESQL_CREDENTIALS='{"host":"postgres","port":5432,"database":"postgres","user":"postgres","password":"postgres","max":10,"idleTimeoutMillis":30000,"connectionTimeoutMillis":2000}'
> JWT_SECRET='<segreto-jwt-sicuro>'
> GROQ_API_KEY='<la-tua-chiave-groq>'
> ```

### 2. Verificare lo stato dei container

```bash
docker-compose ps
```

Per seguire i log dell'applicazione in tempo reale:

```bash
pnpm run docker:logs
# oppure
docker-compose logs -f app
```

### 3. Ricostruire l'immagine dopo modifiche al codice

```bash
pnpm run docker:rebuild
# oppure
docker-compose up -d --build
```

### 4. Fermare e rimuovere i container

```bash
pnpm run docker:down
# oppure
docker-compose down
```

---

## Avviare il Progetto in Locale (senza Docker)

> Richiede Node.js >= 20.x, pnpm >= 9.x e un'istanza PostgreSQL raggiungibile.

### 1. Installare le dipendenze

```bash
pnpm install
```

### 2. Avviare il server locale

```bash
pnpm start
```

Il server si avvierà su `http://localhost:3001` con stage `/DESA`.

### 3. Eseguire i test

```bash
pnpm test
```

I test sono scritti in stile BDD con jest-cucumber e coprono i casi d'uso principali del modulo `maintenances`.

---

## Script pnpm Disponibili

| Script | Descrizione |
|---|---|
| `pnpm start` | Avvia il server locale con serverless-offline (porta 3001) |
| `pnpm run start:docker` | Avvia l'app compilata dentro il container Docker (`node dist/...`) |
| `pnpm test` | Esegue i test con coverage |
| `pnpm run build` | Compila TypeScript → `dist/` |
| `pnpm run lint` | Esegue l'analisi statica ESLint su `src/` |
| `pnpm run docker:up` | Avvia tutti i container (`docker-compose up -d`) |
| `pnpm run docker:down` | Ferma e rimuove i container |
| `pnpm run docker:rebuild` | Ricostruisce l'immagine e riavvia i container |
| `pnpm run docker:restart` | Riavvia solo il container `app` |
| `pnpm run docker:logs` | Segue i log del container `app` |
| `pnpm run docker:build` | Costruisce l'immagine Docker localmente |
| `pnpm run docker:clean` | Ferma i container e rimuove i volumi (`down -v`) |
| `pnpm run sls-deploy` | Deploy su AWS (stage DESA, us-east-1) |

---

## Credenziali di Test

Le credenziali seguenti sono create automaticamente dal file `init.sql` al primo avvio del container:

| Username | Password (testo chiaro) | Cliente | Ruolo |
|---|---|---|---|
| `user1` | `hash1` | Cliente 1 Relacional | admin |
| `user2` | `hash2` | Cliente 2 Relacional | technician |
| `user3` | `hash3` | Cliente 3 Relacional | operator |

> **Nota:** il file `init.sql` inserisce le password già sotto forma di hash bcrypt (`$2b$10$...`). Non è necessario eseguire alcuna migrazione al primo avvio. Le stringhe `hash1`, `hash2`, `hash3` sono le password in testo chiaro da usare nel login; la verifica avviene via `bcrypt.compare`.

### Ottenere un JWT

```bash
POST http://localhost:3000/DESA/V1/auth/login
Content-Type: application/json

{
  "username": "user1",
  "password": "hash1"
}
```

Risposta:
```json
{
  "token": "<JWT_TOKEN>"
}
```

Usare il token come header `Authorization: Bearer <JWT_TOKEN>` in tutte le richieste protette.

---

## Endpoints API

| Metodo | Path | Descrizione | Auth richiesta |
|---|---|---|---|
| `POST` | `/DESA/V1/auth/login` | Login, restituisce JWT | No |
| `GET` | `/DESA/V1/vessels` | Lista navi del tenant | Sì |
| `GET` | `/DESA/V1/vessels/{id}/components` | Componenti di una nave | Sì |
| `POST` | `/DESA/V1/components/{id}/maintenance` | Crea manutenzione | Sì |
| `GET` | `/DESA/V1/maintenance` | Lista manutenzioni del tenant | Sì |
| `PATCH` | `/DESA/V1/maintenance/{id}` | Aggiorna stato manutenzione | Sì |
| `DELETE` | `/DESA/V1/maintenance/{id}` | Elimina manutenzione | Sì |
| `POST` | `/DESA/V1/maintenance/query-ai` | Query AI in linguaggio naturale | Sì |
| `GET` | `/DESA/V1/maintenance/ai-health` | Health check del provider LLM | Sì |
| `GET` | `/DESA/swagger` | Documentazione Swagger UI | No |

---

## Struttura del Progetto

```
maintenance-api-impl-v1/
├── src/
│   ├── common/                         # Codice condiviso (cross-cutting)
│   │   ├── ai/                         # LLMProvider, GroqLLMProvider, AIPromptBuilder
│   │   ├── application/
│   │   │   ├── dto/                    # RequestDto, ResponseDto
│   │   │   ├── exception/              # CustomException, AppException, ErrorConstants
│   │   │   ├── validation/             # UUIDValidator, ValidationMessages
│   │   │   └── validationSchemas/      # Schemi Joi condivisi
│   │   ├── constants/                  # HttpConstants, AIConstants
│   │   ├── db/                         # PostgreSQLConnection, helpers
│   │   ├── infrastructure/
│   │   │   ├── middleware/             # TenantValidator, TenantValidationGuard,
│   │   │   │                           # RequireTenant decorator, TenantInterceptor
│   │   │   └── swagger/               # SwaggerHandler
│   │   └── util/                       # Util, NumberUtil, GeneratorExcelUtil
│   │
│   └── maintenances/                   # Modulo principale (Hexagonal DDD)
│       ├── application/
│       │   ├── ai/                     # AIMaintenanceService, DTOs AI
│       │   ├── dto/
│       │   │   └── request/            # CreateMaintenanceRequest, UpdateMaintenanceRequest,
│       │   │                           # LoginRequest
│       │   ├── service/                # MaintenanceApplicationService
│       │   └── validation/             # MaintenanceRequestValidation
│       ├── domain/
│       │   ├── entities/               # Maintenance, Customer, User, Vessel, Component
│       │   ├── repository/             # Interfacce dei repository (porte)
│       │   └── service/                # MaintenanceDomainService
│       └── infrastructure/
│           ├── bootstrap/              # App.ts (handler Lambda), AppModule, HandleCore
│           ├── controller/             # MaintenanceController, AuthController,
│           │                           # VesselController, AIQueryController, MaintenanceModule
│           └── repository/             # MaintenancePostgreRepository (adattatore PostgreSQL)
│
├── test/                               # Test BDD (jest-cucumber)
│   ├── common/application/
│   ├── features/maintenances/          # File .feature (Gherkin)
│   └── maintenances/application/       # Step definitions
│
├── config/
│   └── serverless/                     # Template VTL, configurazione HTTP, funzioni
│       └── request/                    # Template di mappatura per ogni endpoint
│
├── scripts/
│   └── migrate-passwords-bcrypt.ts     # Script migrazione password → bcrypt
│
├── Dockerfile                          # Immagine Docker per l'applicazione Node.js
├── docker-compose.yml                  # Stack completa: app + database PostgreSQL
├── init.sql                            # Schema DDL + dati di esempio
├── serverless.yaml                     # Configurazione Serverless Framework
├── tsconfig.json                       # Configurazione TypeScript
├── jest.config.js                      # Configurazione Jest
└── package.json
```

---

## Assunzioni Progettuali

- **Multi-tenancy per `customerId`**: ogni utente appartiene a un cliente (`customer`). Tutti i dati (navi, componenti, manutenzioni) sono isolati per `customerId`. Nessun utente può accedere o modificare dati di un altro tenant.

- **Architettura Lambda-first**: il progetto non usa un server HTTP tradizionale. Ogni richiesta viene instradata da API Gateway verso una singola funzione Lambda (`maintenances`) tramite il campo `action` iniettato dai template VTL.

- **JWT autofirmato (HS256)**: il secret JWT è configurato come variabile d'ambiente. In locale è incluso nel `serverless.yaml` per semplicità. In produzione deve provenire da AWS Secrets Manager / SSM Parameter Store.

- **Integrazione Lambda (non proxy)**: si usa l'integrazione `lambda` di API Gateway, non `lambda-proxy`. I template VTL in `config/serverless/request/` mappano il payload in ingresso e `response.vm` mappa lo stato HTTP dalla risposta Lambda.

- **Nessun ORM**: si usano query SQL parametriche native per massimizzare il controllo e prevenire SQL injection.

- **Un solo handler per tutte le route**: tutte le rotte HTTP sono gestite dalla stessa funzione Lambda (`maintenances`). `HandleCore.ts` fa da router interno basandosi sull'azione codificata nel template VTL.

- **Groq come LLM provider**: le query AI usano il modello `llama3-8b-8192` tramite Groq. In assenza di `GROQ_API_KEY` valida, il feature AI non sarà disponibile.

---

## Dati di Esempio (Seed)

Il file `init.sql` crea automaticamente al primo avvio di Docker:

- **3 clienti** (`Cliente 1 Relacional`, `Cliente 2 Relacional`, `Cliente 3 Relacional`)
- **3 utenti** (`user1`, `user2`, `user3`) ciascuno associato al proprio cliente
- **3 navi** (`Vessel A`, `Vessel B`, `Vessel C`)
- **3 componenti** (`Motor Principal 1`, `Bomba Hidráulica 2`, `Generador Eléctrico 3`)
- **3 manutenzioni** con stati `scheduled`, `completed` e `in-progress`

Per re-inizializzare il database da zero (elimina anche i volumi):

```bash
pnpm run docker:clean
docker-compose up -d
```

oppure:

```bash
docker-compose down -v
docker-compose up -d
```

---

## Variabili d'Ambiente

Le seguenti variabili sono già preconfigurate in `serverless.yaml` per l'ambiente locale. In produzione devono essere lette da SSM/Secrets Manager.

| Variabile | Descrizione | Default locale |
|---|---|---|
| `JWT_SECRET` | Chiave segreta JWT (min 32 char) | Valore hardcoded in `serverless.yaml` |
| `JWT_AUDIENCE` | Audience JWT | `maintenance-api` |
| `JWT_ISSUER` | Issuer JWT | `maintenance-api-issuer` |
| `JWT_EXPIRATION` | Durata token | `24h` |
| `POSTGRESQL_CREDENTIALS` | JSON con credenziali DB | Credenziali Docker locali |
| `GROQ_API_KEY` | API Key Groq per LLM | Valore hardcoded in `serverless.yaml` |
| `STAGE` | Stage di deploy | `DESA` |
