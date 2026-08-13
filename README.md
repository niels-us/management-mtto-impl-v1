# Maintenance Fleet Manager (MTTO)

Fleet maintenance management system. Composed of a serverless backend on AWS Lambda and a React frontend deployed on S3 + CloudFront, with infrastructure managed via Terraform.

---

## Architecture

```
┌──────────────┐     ┌──────────────────────────────────┐
│   Frontend   │     │            Backend                │
│  React + Vite │────▶│  API Gateway → Lambda → RDS      │
│  S3 + CF     │     │  Serverless Framework             │
└──────────────┘     └──────────────────────────────────┘
                            ┌──────────────────┐
                            │  Infrastructure   │
                            │  Terraform        │
                            │  RDS + S3 + IAM   │
                            └──────────────────┘
```

| Component | Tech Stack | Deployment |
|---|---|---|
| **Frontend** | React 19, Vite 8, TypeScript 6, Tailwind 4 | S3 + CloudFront |
| **Backend** | Node.js 24 (runtime `nodejs24.x`), TypeScript 5, NestJS 10, Serverless 4 | Lambda + API Gateway |
| **Database** | PostgreSQL 15 (RDS) | Terraform |
| **Infrastructure** | Terraform 1.5+ | `terraform apply` |

---

## Prerequisites

- **Docker** and **Docker Compose** (local development)
- **Node.js** 24 — pinned via `.nvmrc` in `backend/` and `frontend/` (only if not using Docker)
- **pnpm** 10 (`packageManager: pnpm@10.33.0` in both workspaces)
- **AWS CLI** configured (deployment)
- **Terraform** >= 1.5 (infrastructure)

---

## Local Development

Start the entire stack with a single command:

```bash
docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3000/DESA/swagger.json |
| PostgreSQL | localhost:5432 (user: postgres, pass: postgres) |

### Environment

Create `backend/.env` (gitignored, not versioned) — it is injected into the local stack
by `docker-compose.yml` (`env_file: ./backend/.env`) and used as the local fallback for
runtime secrets:

```env
POSTGRESQL_CREDENTIALS='{"host":"mtto-db","port":5432,"database":"postgres","user":"postgres","password":"postgres","max":10,"idleTimeoutMillis":30000,"connectionTimeoutMillis":2000}'
JWT_SECRET='<secure-jwt-secret>'
GROQ_API_KEY='<your-groq-api-key>'
SERVERLESS_ACCESS_KEY='<serverless-v4-access-key>'   # required to deploy with Serverless Framework v4
```

Runtime secrets (`POSTGRESQL_CREDENTIALS`, `JWT_SECRET`, `GROQ_API_KEY`) resolve in a
**single line** per secret in `backend/serverless.yaml` with SSM-first precedence:

```
${ssm:/MAINTENANCE-API/<stage>/<NAME>, env:<NAME>, '###'}
```

1. **Cloud (deploy):** read from SSM Parameter Store (`/MAINTENANCE-API/<stage>/...`).
2. **Local (`serverless-offline`):** falls back to the `backend/.env` value when the
   SSM parameter is missing.
3. **Last resort:** the `'###'` placeholder.

---

## Deploy to AWS

### 1. Infrastructure (one-time)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars  # fill in values
terraform init
terraform apply
```

This creates: RDS, S3 buckets (frontend + deploy), IAM roles, SSM parameters.

### 2. Backend (Serverless Framework)

```bash
cd backend
pnpm run sls-deploy   # build (swc) + esbuild bundle + serverless deploy --stage DESA
```

> Serverless Framework **v4 requires authentication for every command**. Set
> `SERVERLESS_ACCESS_KEY` in `backend/.env` (or run `serverless login`).
> Lambdas run on **nodejs24.x** (arm64); the `swagger`/`swaggerJson` packages are
> slimmed to ~70 KB via per-function packaging (`package.individually` + excludes).

### 3. Frontend (S3 + CloudFront)

```bash
cd frontend

# Option A — without Docker (requires Node.js locally)
pnpm run build
aws s3 sync dist/ s3://mtto-frontend-<account_id>-desa --delete

# Option B — using Docker
docker build --target build -t frontend-deployer .
docker run --rm \
  -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN \
  --entrypoint sh \
  frontend-deployer
  # inside the container:
  pnpm run build
  aws s3 sync dist/ s3://mtto-frontend-<account_id>-desa --delete
  exit
```

### 4. Invalidate CloudFront (after frontend updates)

```bash
aws cloudfront create-invalidation \
  --distribution-id <cloudfront-id> \
  --paths "/*"
```

Get outputs from Terraform:

```bash
terraform output frontend_bucket_name
terraform output cloudfront_distribution_id
```

---

## Project Structure

```
├── backend/              # Serverless API (Node.js + TypeScript)
│   ├── src/              # Source code (Hexagonal Architecture)
│   ├── config/           # Serverless Framework config
│   ├── test/             # BDD tests (jest-cucumber)
│   ├── Dockerfile
│   ├── .nvmrc            # Node.js 24
│   └── serverless.yaml
│
├── frontend/             # React SPA + Vite + Tailwind
│   ├── src/              # Components, hooks, services
│   ├── Dockerfile        # Multi-purpose: build + nginx
│   ├── nginx.conf        # Nginx SPA configuration
│   ├── .nvmrc            # Node.js 24
│   └── docker-entrypoint.sh  # Runtime env var injection
│
├── terraform/            # Infrastructure as Code
│   ├── modules/
│   │   ├── backend/      # RDS, IAM, SSM, S3 deploy
│   │   └── frontend/     # S3 hosting, CloudFront
│   └── main.tf
│
└── docker-compose.yml    # Local orchestration
```

---

## Component Documentation

- [Backend](backend/README.md) — API endpoints, hexagonal architecture, tests
- [Frontend](frontend/README.md) — SPA technical details

---

## Test Credentials (Local)

| Username | Password |
|---|---|
| user1 | hash1 |
| user2 | hash2 |
| user3 | hash3 |

```bash
curl -X POST http://localhost:3000/DESA/V1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"hash1"}'
```
