# Respuestas al Proyecto - Maintenance API

## Pregunta 1 — Escalabilidad y Arquitectura en AWS

Ante un aumento significativo de clientes, buques y operaciones de mantenimiento, la arquitectura debe evolucionar de un entorno de desarrollo local hacia una solución de grado empresarial en la nube (AWS). Estos son los pilares clave:

### 1. Gestión de Conexiones a la Base de Datos (AWS RDS Proxy)
Dado que el proyecto utiliza **AWS Lambda**, el problema principal al escalar es que cada instancia abre una conexión persistente a PostgreSQL, pudiendo colapsar el motor.
- **Solución:** Implementar **RDS Proxy** para realizar un "pooling" eficiente de conexiones, permitiendo que miles de Lambdas compartan un número reducido de conexiones a la DB, garantizando estabilidad.

### 2. Capa de Caching y Lectura (Amazon ElastiCache + Réplicas)
- **Caching con Redis:** Consultar datos estáticos o maestros (metadata de buques, clientes, tipos de componentes) constantemente golpea al RDS innecesariamente. Usaría **Redis** para cachear estas respuestas, reduciendo la latencia de milisegundos a microsegundos.
- **Réplicas de Lectura:** Para aliviar la carga de la instancia principal de base de datos, derivaría todas las consultas `GET` de historiales hacia una **Réplica de Lectura**, dejando la instancia primaria exclusivamente para las inserciones y actualizaciones críticas de mantenimiento.

### 3. Procesamiento Asíncrono (AWS SQS + Lambda)
Operaciones costosas como la subida de documentación técnica masiva o generación de reportes mensuales no deben bloquear la API.
- **Solución:** Introducir una arquitectura orientada a eventos usando **Amazon SQS**. La API recibe la petición, la encola y vuelve de inmediato al usuario; otra Lambda procesa el trabajo pesado en segundo plano sin degradar la experiencia de usuario.

### 4. Seguridad y Robustez de Producción
- **Arquitectura de Red (VPC):** Aislaría el RDS y las Lambdas en subredes privadas, comunicándose con servicios externos (como S3 para documentación técnica) a través de **VPC Endpoints** para evitar la internet pública.
- **AWS Secrets Manager:** Eliminaría el uso de archivos `.env` locales para gestionar las credenciales de la DB y las claves JWT de forma segura y rotativa.

- **Containerización local (Docker + Docker Compose):** El entorno de desarrollo completo — aplicación y base de datos — está orquestado con Docker Compose. El container `mtto-app` ejecuta `serverless offline` dentro del container vía `dumb-init`, mientras que `mtto-db` levanta PostgreSQL 15 con el seed automático desde `init.sql` (las contraseñas ya están insertadas con hash bcrypt, sin necesidad de migración manual). El archivo `docker.env` se excluye del control de versiones (`.gitignore`) por seguridad, siguiendo las recomendaciones de GitHub Secret Scanning. Esto elimina dependencias locales de Node.js y garantiza entornos reproducibles entre desarrolladores.

---


## Pregunta 2 — Elección de Tecnología (FastAPI vs NestJS)

Para un proyecto de estas características (API de Mantenimiento, PostgreSQL, JWT, despliegue Serverless), estas son las consideraciones sobre las dos tecnologías principales:

### NestJS (Opción Seleccionada)

**Ventajas:**
- **Arquitectura Robusta:** Su estructura modular y de inyección de dependencias obliga a mantener el código organizado, lo cual es vital en sistemas empresariales de larga duración.
- **Tipado Fuerte (TypeScript):** Ofrece una seguridad superior en el manejo de datos complejos de buques y mantenimientos, reduciendo errores en tiempo de ejecución.
- **Documentación Nativa:** Genera especificaciones OpenAPI (Swagger) de forma muy integrada, facilitando el trabajo de integración con el frontend.

**Desventajas:**
- **Curva de Aprendizaje:** Es más compleja que FastAPI debido a su arquitectura inspirada en Angular (decoradores, módulos, DI).
- **Sobrecarga (Boilerplate):** Requiere escribir más código inicial para tareas simples en comparación con frameworks más directos.

---

### FastAPI (Python)

**Ventajas:**
- **Rendimiento Extremo:** Es uno de los frameworks más rápidos para Python, con soporte nativo de `async/await`.
- **Rapidez de Desarrollo:** Permite crear endpoints funcionales con mucho menos código y boilerplate.
- **Cold Starts:** Al ser un entorno más ligero que Node.js + NestJS, las Lambdas suelen arrancar más rápido.

**Desventajas:**
- **Falta de Estructura Forzada:** Si el equipo no es disciplinado, es fácil que el proyecto pierda cohesión arquitectónica (se vuelva "espagueti") al no imponer capas como NestJS.
- **Ecosistema de Tipado:** Aunque usa hints de Python, no es tan robusto como el sistema de tipos de TypeScript en grandes bases de código.

### Conclusión
Aunque **FastAPI** es una excelente opción por su velocidad, para una **API de Mantenimiento** que requiere escalabilidad y mantenibilidad por parte de múltiples desarrolladores a largo plazo, **NestJS** es la elección ganadora por la rigidez de su arquitectura y la seguridad que aporta TypeScript.

---

## Pregunta 3 — Bonificación por IA/LLM

Esta funcionalidad fue desarrollada e implementada en el proyecto como parte de la entrega, a través del endpoint `POST /DESA/V1/maintenance/query-ai`.

### Configuración del LLM

| Parámetro | Valor |
|---|---|
| Proveedor | Groq |
| Modelo | `llama-3.3-70b-versatile` |
| Temperatura | `0.3` (respuestas precisas y controladas) |
| Max tokens | `1000` |
| Timeout por request | `30 000 ms` |
| Reintentos automáticos | `3` intentos con `1 000 ms` de espera entre cada uno |
| Rate limit (referencia) | `10 req/min`, `100 req/hora` |

### Enfoque Arquitectónico: LLM Contextual con datos reales de la BD

En lugar de una arquitectura RAG completa con base de datos vectorial (que requeriría infraestructura adicional como Pinecone o pgvector), se optó por un enfoque pragmático de **LLM con contexto dinámico**: el backend recopila en tiempo real los datos del cliente desde la base de datos y los inyecta como contexto al LLM (Groq) junto con la pregunta del usuario.

El flujo de una consulta es el siguiente:
1. El técnico envía una pregunta en lenguaje natural al endpoint.
2. El backend extrae el `customerId` del JWT del usuario.
3. Se consulta la BD obteniendo únicamente los buques, componentes y mantenimientos de ese cliente.
4. `AIPromptBuilder` formatea ese contexto (buques, componentes, historial) y construye el prompt final.
5. `AIConstants.getSystemPrompt()` detecta automáticamente el idioma de la pregunta (Italiano o Inglés) y selecciona el system prompt correspondiente.
6. La respuesta del LLM, junto con la `question` original, el `timestamp` y el `processingTimeMs`, se devuelven al técnico.

### Soporte Multilingüe

El sistema detecta automáticamente el idioma de la pregunta mediante análisis de palabras clave (`AIConstants.LANGUAGE_KEYWORDS`) y selecciona el system prompt apropiado:
- **Italiano:** activado por palabras clave como `imbarcazioni`, `manutenzione`, `cronologia`, etc.
- **Inglés:** idioma por defecto si no se detectan keywords en italiano.

Esto permite que técnicos de diferentes países interactúen con el sistema en su idioma nativo sin configuración adicional.

### Cómo se garantizan los 4 pilares:

**Separación de datos entre clientes (Multi-tenancy)**
El `AIQueryController` extrae el `customerId` del JWT y lo usa como filtro obligatorio en cada consulta a la base de datos (`gatherMaintenanceContext(customerId)`). Es arquitectónicamente imposible que un técnico de un cliente reciba contexto de datos de otro cliente.

**Control de acceso**
Antes de procesar cualquier consulta, el controller valida que el JWT contenga un `customerId` válido, retornando un `401 Unauthorized` si el token no está presente o es inválido. El acceso al endpoint requiere autenticación JWT en todos los casos.

**Trazabilidad de las respuestas**
Cada respuesta incluye en su estructura: la `question` original formulada, el `timestamp` exacto de la consulta, el `processingTimeMs` del tiempo de procesamiento, y la fuente de datos (`dataSource: "database"`). Adicionalmente, el logger registra cada consulta con el `customerId`, permitiendo auditoría completa en CloudWatch en producción.

**Fiabilidad del sistema**
El `AIMaintenanceService` verifica que el LLM esté disponible antes de procesar (`llmProvider.isConfigured()`). El `GroqLLMProvider` implementa un mecanismo de **reintentos automáticos** (3 intentos con 1s de espera) para absorber fallos transitorios de la API de Groq. El `system prompt` instruye explícitamente al modelo a responder únicamente con los datos de contexto provistos, evitando alucinaciones. En caso de error del LLM o de la BD, el sistema retorna una respuesta de error controlada sin exponer detalles internos al cliente.

### Mejora futura: Arquitectura RAG completa
Para escalar esta funcionalidad a documentación técnica extensa (manuales, planos, notas de campo), el siguiente paso sería introducir una **base de datos vectorial** (como `pgvector` sobre el mismo PostgreSQL existente) para almacenar embeddings de documentos, filtrando siempre por `client_id` como metadato obligatorio en cada búsqueda de similitud.
