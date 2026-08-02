# Dockerfile - Node.js 20 + TypeScript (Serverless Offline)

FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache curl dumb-init python3 make g++ aws-cli

# Copiar package.json
COPY package.json package-lock.json ./

# Instalar todas las dependencias (incluidas devDependencies para serverless-offline)
RUN npm ci

# Copiar código y configuración
COPY tsconfig.json ./
COPY .swcrc ./
COPY src ./src
COPY config ./config
COPY openapi.json ./
COPY serverless.yaml ./
COPY jest.config.js ./
COPY test ./test

# Compilar a dist/ con SWC
RUN npm run build

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
CMD ["npx", "serverless", "offline", "start", "--stage", "DESA", "--param=functionsFile=local", "--host", "0.0.0.0"]
