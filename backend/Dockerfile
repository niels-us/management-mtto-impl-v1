# Dockerfile - Node.js 24 + TypeScript (Serverless Offline)

FROM node:24-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache curl dumb-init python3 make g++ aws-cli

# Copiar package.json
COPY package.json pnpm-lock.yaml .npmrc ./

# Instalar todas las dependencias (incluidas devDependencies para serverless-offline)
RUN corepack enable && pnpm install --frozen-lockfile

# Pre-descargar el binario sf-core de Serverless v4 (queda horneado en la imagen, evita re-descarga en runtime)
RUN pnpm exec serverless --version

# Copiar código y configuración
COPY tsconfig.json ./
COPY .swcrc ./
COPY src ./src
COPY config ./config
COPY openapi.json ./
COPY serverless.yaml ./
COPY jest.config.cjs ./
COPY test ./test
COPY scripts ./scripts

# Compilar a dist/ y bundle con esbuild
RUN pnpm run build
RUN pnpm run bundle

# Variables de entorno
ENV NODE_ENV=development
ENV STAGE=DESA
ENV PORT=3000
ENV IS_AUTH_IAM=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD curl -f http://0.0.0.0:3000/DESA/swagger.json || exit 1

# Puerto
EXPOSE 3000

# Comando de inicio
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["pnpm", "exec", "serverless", "offline", "start", "--stage", "DESA", "--param=functionsFile=local", "--param=dynamoEndpoint=http://dynamodb-local:8000", "--host", "0.0.0.0"]
