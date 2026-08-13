# Informe Técnico — Impacto de la Minificación en el Cold Start

**Función:** `UE1MAINTDESACOMLMBMAINTENANCEAPI001` · **Entorno:** DESA · **Región:** us-east-1
**Recursos:** 512MB / arm64 / Node.js 20 · **Fecha:** 2026-08-11

---

## 1. Resumen ejecutivo

Se compararon dos compilaciones de la misma API desplegada en Lambda (sin minificar vs. minificado con esbuild `--minify --splitting`), midiendo invocaciones en frío vía X-Ray.

- **Init: −20%** (−111ms promedio): la minificación cumple su objetivo y reduce la fase de arranque.
- **Duration: +27%** (+163ms promedio): la Duration empeoró y **anuló la ganancia**.
- **Cold start total: prácticamente plano** (+2.8%, dentro del margen de ruido).
- **Costo por cold start: +4.5%** a 512MB con minificar (más GB-s en Duration de lo que ahorra Init).

Conclusión: la minificación es válida por la mejora de Init, pero **debe validarse con una prueba A/B controlada** antes de asumir que es gratuita; la regresión de Duration es sugestiva, no concluyente.

---

## 2. Stack y tecnologías

### Infraestructura AWS (Serverless, us-east-1, stage DESA, account 940813655782)
- **Lambda principal** `UE1MAINTDESACOMLMBMAINTENANCEAPI001` — runtime **Node.js 20.x**, arquitectura **arm64**, memoria **512MB**, timeout **30s**, `versionFunctions: false`, **X-Ray activado** (`tracing.lambda: true`), retención de logs **30 días**. Handler: `dist-bundle/App.handler`.
- **Lambdas auxiliares:** `maintenance-api-DESA-swagger` y `maintenance-api-DESA-swaggerJson` (UI Swagger y JSON OpenAPI).
- **API Gateway** REST (`integration: lambda`, no-proxy) con **API Key + Usage Plan** en rutas `private: true`, templates Velocity (`config/serverless/request/*.vm`, `http-response.yaml`), CORS y headers de seguridad, endpoint `REGIONAL`.
- **IAM Role** por entorno: `UE1CTDESASEGIAMROLEMAINTENANCEAPI001` (logs, SSM/Secrets, RDS, EC2/VPC, S3).
- **Despliegue:** **Serverless Framework 3** (`serverless deploy --stage DESA`), plantillas CloudFormation, `package: individually`.
- **Bucket S3** de despliegue: `ue1ctdesastgmaintenanceapi001`.
- **Secretos:** Parameter Store / Secrets Manager (`/MAINTENANCE-API/DESA/*`) para `POSTGRESQL_CREDENTIALS`, `JWT_SECRET`, `GROQ_API_KEY`.

### Backend — aplicación
- **TypeScript 5.3** + **NestJS 10** en modo *application-context* (sin capa HTTP; dispatcher propio `HandleCore` por `event.action`).
- Transpilación: **SWC** (`swc src -d dist`). Empaque: **esbuild** (`--bundle --minify --splitting`; `external: bcrypt, pg-native`, etc.).
- Librerías: **pg** (PostgreSQL), **jsonwebtoken** (JWT HS256), **joi** (validación), **@middy/core** (wrapper del handler), **groq-sdk** (LLM de Groq, cargado lazy en chunk separado), **bcrypt** (nativo), **uuid**, **rxjs**.
- Middleware de negocio: `TenantValidator` / `TenantValidationGuard` / `TenantInterceptor` (multi-tenant); excepciones con códigos estables (`CustomException`, p.ej. `ROUTE_001`, `AUTH001`).
- **Swagger** expuesto mediante handlers Lambda separados (UI + OpenAPI JSON).

---

## 3. Metodología

- Invocaciones en frío (sin reutilización de contenedor), medidas con X-Ray por fase: **Init / Overhead / Duration**.
- 5 muestras por compilación, sobre los mismos endpoints representativos.
- Compilaciones:
  - **SIN minificar:** bundle esbuild sin `--minify`.
  - **CON minificar:** bundle esbuild con `--minify --splitting` (~848KB entry vs ~1.35MB sin minificar).

---

## 4. Datos recopilados

### Build SIN minificar
| Endpoint | Init | Duration | Overhead | Total |
|---|---|---|---|---|
| /V1/auth/login | 556ms | 751ms | 15ms | 1.52s |
| /V1/auth/login | 572ms | 729ms | 1ms | 1.48s |
| /V1/maintenance | 457ms | 476ms | 1ms | 1.13s |
| /V1/vessels | 576ms | 508ms | 1ms | 1.32s |
| /V1/vessels/{id}/components | 596ms | 497ms | 0ms | 1.32s |
| **Promedio** | **551.4ms** | **592.2ms** | 3.6ms | **1.354s** |

### Build CON minificar
| Endpoint | Init | Duration | Overhead | Total |
|---|---|---|---|---|
| /V1/auth/login | 416ms | 899ms | 1ms | 1.55s |
| /V1/auth/login | 388ms | 889ms | 17ms | 1.44s |
| /V1/maintenance | 402ms | 614ms | 1ms | 1.19s |
| /V1/maintenance | 498ms | 688ms | 19ms | 1.38s |
| /V1/vessels | 498ms | 685ms | 1ms | 1.40s |
| **Promedio** | **440.4ms** | **755.0ms** | 7.8ms | **1.392s** |

---

## 5. Análisis comparativo

| Métrica | Sin minificar | Minificado | Δ absoluto | Δ % |
|---|---|---|---|---|
| **Init** | 551.4ms | 440.4ms | **−111ms** | **−20.1%** ▲ |
| **Duration** | 592.2ms | 755.0ms | **+162.8ms** | **+27.5%** ▼ |
| **Total cold start** | 1.354s | 1.392s | **+38ms** | **+2.8%** ⚠ |
| Overhead | 3.6ms | 7.8ms | +4.2ms | ruido |

*(Excluyendo `/auth/login` — la ruta más pesada por bcrypt/JWT: Init ≈ 543→466ms (−14%), Duration ≈ 494→662ms (+34%). La tendencia se mantiene.)*

---

## 6. Análisis de costo (512MB, us-east-1)

| Costo por cold start | Sin minificar | Minificado | Δ |
|---|---|---|---|
| GB-s Init (551.4 / 440.4 ms × 0.5) | 0.2757 | 0.2202 | **−0.0555** |
| GB-s Duration (592.2 / 755.0 ms × 0.5) | 0.2961 | 0.3775 | **+0.0814** |
| **Total GB-s / cold start** | **0.5718** | **0.5977** | **+0.0259 (+4.5%)** |
| $ por 1M cold starts | ~$9.53 | ~$9.96 | +$0.43 |

> Nota: 512MB es la cifra oficial (config `serverless.yaml` y consola AWS). La herramienta de monitoreo reporta 524MB; la diferencia es ~2% y no altera las conclusiones.

---

## 7. Conclusiones

1. **La minificación cumple su objetivo en Init:** −20% (−111ms). El bundle minificado descarga, parsea y evalúa más rápido en la fase Init.
2. **La Duration empeoró (+27%)** y **anuló la ganancia**: el total del cold start quedó prácticamente plano (+2.8%, dentro del ruido).
3. **Caveat estadístico:** muestra pequeña (n=5), no aparada y con endpoints heterogéneos; la diferencia de Duration es *sugestiva, no concluyente* (ruido de DB, runtime o JIT en la 1ª invocación).
4. **Impacto operativo:** si el +27% de Duration se confirmara también en invocaciones cálidas, sería una penalización en cada request (latencia y costo GB-s), no solo en el arranque. El costo por cold start es ~4.5% mayor con minificar.

---

## 8. Recomendaciones

- **No descartar la minificación** por este resultado, pero **no asumir que es gratuita**: la decisión de mantenerla es razonable (Init es lo más visible en UX de cold start) y requiere validación controlada.
- **Prueba A/B controlada** para confirmar/descartar la regresión de Duration:
  1. Un endpoint de referencia ligero (`/V1/maintenance`) y otro pesado (`/V1/auth/login`).
  2. n≥20 por build, alternando builds, con contenedor frío garantizado en cada iteración.
  3. Registrar Init, Duration y además **latencia cálida** (impacto permanente, no solo el arranque).
- **Alternativa intermedia:** si la regresión se confirma y/o se prioriza la legibilidad (observabilidad), evaluar `--minify-whitespace --minify-syntax` (esbuild): mantiene los nombres de identificadores, conserva gran parte del ahorro de bytes/Init y deja código parcialmente legible. Debe medirse igualmente.
- **Independiente del build:** aplicar la estrategia de observabilidad (logging estructurado con `errorCode`/`requestId` + source maps) para poder localizar errores aunque el stack sea ilegible.

---

## 9. Anexo — interpretación por fase

- **Init −20%:** efecto esperado y **confirmado** de la reducción de tamaño (~−37% de bytes).
- **Duration +27%:** hipótesis a validar (a) renombrado de identificadores y patrones de optimización V8; (b) ruido/factores externos (DB); (c) distribución desigual de requests pesados entre muestras. La muestra actual no permite discriminar.
- **Overhead:** despreciable (0–19ms, dominado por ruido del runtime).