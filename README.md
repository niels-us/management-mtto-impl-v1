# Maintenance Fleet Manager (MTTO)

Sistema de gestión de mantenimiento para flotas navales. Compuesto por un backend serverless en AWS Lambda y un frontend React desplegado en S3 + CloudFront, con infraestructura gestionada via Terraform.

---

## Arquitectura

```
┌──────────────┐     ┌──────────────────────────────────┐
│   Frontend   │     │            Backend                │
│  React + Vite │────▶│  API Gateway → Lambda → RDS      │
│  S3 + CF     │     │  Serverless Framework             │
└──────────────┘     └──────────────────────────────────┘
                            ┌──────────────────┐
                            │   Infraestructura │
                            │   Terraform       │
                            │   RDS + S3 + IAM  │
                            └──────────────────┘
```

| Componente | Tecnología | Despliegue |
|---|---|---|
| **Frontend** | React 19, Vite 8, TypeScript 6, Tailwind 4 | S3 + CloudFront |
| **Backend** | Node.js 20, TypeScript 5, NestJS 10, Serverless 3 | Lambda + API Gateway |
| **Base de datos** | PostgreSQL 15 (RDS) | Terraform |
| **Infraestructura** | Terraform 1.5+ | `terraform apply` |

---

## Requisitos

- **Docker** y **Docker Compose** (desarrollo local)
- **Node.js** >= 20 (solo si no usas Docker)
- **AWS CLI** configurado (deploy)
- **Terraform** >= 1.5 (infraestructura)

---

## Desarrollo Local

Levanta todo el stack con un solo comando:

```bash
docker compose up -d
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3000/DESA/swagger.json |
| PostgreSQL | localhost:5432 (user: postgres, pass: postgres) |

### Entorno

Crear `docker.env` en la raíz (no versionado):

```env
POSTGRESQL_CREDENTIALS='{"host":"mtto-db","port":5432,"database":"postgres","user":"postgres","password":"postgres","max":10,"idleTimeoutMillis":30000,"connectionTimeoutMillis":2000}'
JWT_SECRET='xK8mP2nR5vY9bC3fG6jL1oQ4sU7wZ0aD2eH5tM8pR1vY4cF7jL9oQ2sU5wX8zA='
GROQ_API_KEY='<tu-api-key-groq>'
```

> Copiar de `backend/docker.env.example` si no existe.

---

## Deploy a AWS

### 1. Infraestructura (una sola vez)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars  # completar valores
terraform init
terraform apply
```

Esto crea: RDS, S3 buckets (frontend + deploy), IAM roles, parámetros en SSM.

### 2. Backend (Serverless Framework)

```bash
cd backend
npm run sls-deploy
```

### 3. Frontend (S3 + CloudFront)

```bash
cd frontend

# Opción A — sin Docker (requiere Node.js local)
npm run build
aws s3 sync dist/ s3://mtto-frontend-<account_id>-desa --delete

# Opción B — usando Docker
docker build --target build -t frontend-deployer .
docker run --rm \
  -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN \
  --entrypoint sh \
  frontend-deployer
  # dentro del contenedor:
  npm run build
  aws s3 sync dist/ s3://mtto-frontend-<account_id>-desa --delete
  exit
```

### 4. Invalidar CloudFront (si se actualizó el frontend)

```bash
aws cloudfront create-invalidation \
  --distribution-id <cloudfront-id> \
  --paths "/*"
```

Los outputs de Terraform te dan el bucket name y distribution ID:

```bash
terraform output frontend_bucket_name
terraform output cloudfront_distribution_id
```

---

## Estructura del Proyecto

```
├── backend/              # API Serverless (Node.js + TypeScript)
│   ├── src/              # Código fuente (Arquitectura Hexagonal)
│   ├── config/           # Config Serverless Framework
│   ├── test/             # Tests BDD (jest-cucumber)
│   ├── Dockerfile
│   └── serverless.yaml
│
├── frontend/             # SPA React + Vite + Tailwind
│   ├── src/              # Componentes, hooks, servicios
│   ├── Dockerfile        # Multi-uso: build + nginx
│   ├── nginx.conf        # Config Nginx para SPA
│   └── docker-entrypoint.sh  # Inyección dinámica de env vars
│
├── terraform/            # Infraestructura como código
│   ├── modules/
│   │   ├── backend/      # RDS, IAM, SSM, S3 deploy
│   │   └── frontend/     # S3 hosting, CloudFront
│   └── main.tf
│
└── docker-compose.yml    # Orquestación local
```

---

## Documentación por Componente

- [Backend](backend/README.md) — API endpoints, arquitectura hexagonal, tests
- [Frontend](frontend/README.md) — Detalles técnicos de la SPA

---

## Credenciales de Prueba (Local)

| Usuario | Password |
|---|---|
| user1 | hash1 |
| user2 | hash2 |
| user3 | hash3 |

```bash
curl -X POST http://localhost:3000/DESA/V1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"hash1"}'
```
