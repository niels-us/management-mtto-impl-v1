# Módulo `maintenances`

Este módulo replica la estructura hexagonal del módulo `maintenance` pero para el nuevo dominio de mantenimiento de flotas.

## Requisitos funcionales implementados

1. Modelización de datos
- Entidades: `Customer`, `User`, `Vessel`, `Component`, `Maintenance`.
- Relaciones implementadas por referencia de `customerId` en todas las entidades, `vesselId` en componentes y `componentId` en mantenimiento.

2. Autenticación JWT
- Endpoint `login` en `AuthController` genera token JWT con `customerId`.
- Clave secreta: `process.env.JWT_SECRET`.

3. Control de accesos (multi-tenancy)
- En todos los endpoints, los queries están filtrados por `customerId` del usuario autenticado.
- Usuarios sólo pueden acceder a datos de su cliente: se comprueba en Domain Service.

4. API REST (mapeo de acción, dado patrón de `HandleCore` actual)
- `POST /auth/login` -> acción `login`
- `GET /vessels` -> acción `getVessels`
- `GET /vessels/{id}/components` -> acción `getVesselComponents`
- `POST /components/{id}/maintenance` -> acción `createMaintenance`
- `GET /maintenance` -> acción `getMaintenance`
- `PATCH /maintenance/{id}` -> acción `updateMaintenance`

5. Persistencia de datos
- Repositorio `MaintenancePostgreRepository` usa `PostgreSQLConnection`, con consultas SQL paramétricas.
- Normalización: `vessels`, `components`, `maintenance`, `users`, `customers`.

## Estructura de carpetas
- `application/` (servicios, validaciones, DTO)
- `domain/` (entidades, repositorios, lógicas de dominio)
- `infrastructure/` (controladores, módulo, repositorio PostgreSQL)
