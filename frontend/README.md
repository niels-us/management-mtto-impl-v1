# MTTO Fleet Manager — Frontend

SPA construida con **React 19 + Vite + TypeScript + Tailwind 4 + TanStack Query + shadcn/ui**, desplegada en **S3 + CloudFront**.

Stack: React 19, Vite 8, TypeScript 6, Tailwind 4, react-router 7, axios, zod, react-hook-form, recharts, lucide-react.

## Arquitectura (FSD — Feature-Sliced Design)

La aplicación sigue **Feature-Sliced Design** en su variante reducida. El código se organiza en capas con **dependencias unidireccionales** (de la capa superior a la inferior):

```
app/       → pages/ → features/ → entities/ → shared/
```

| Capa | Contenido | Importa de |
|---|---|---|
| `app/` | Entry, providers, router, layouts, estilos globales | pages, features, entities, shared |
| `pages/` | 1 página por ruta (solo composición) | features, entities, shared |
| `features/` | Capacidades de negocio: `auth`, `vessels`, `components`, `maintenance`, `ai` — cada una con su `api.ts`, `hooks.ts` y `model.ts` propios | entities, shared |
| `entities/` | Entidades de dominio (`vessel`, `component`, `maintenance`) con tipos + schemas zod | shared |
| `shared/` | Infraestructura reutilizable: `api/` (cliente axios), `ui/` (shadcn), `lib/`, `contracts/` | (nada) |

### Reglas de capas (convención, se respeta en code review)

1. Las dependencias fluyen **solo hacia abajo**: `app → pages → features → entities → shared`.
2. **Ninguna capa inferior importa de una superior** (ej.: `shared/` nunca importa de `features/`).
3. **Las features no se importan entre sí.** La comunicación entre features se hace vía `entities/` o `shared/`.
4. Las páginas **solo componen**; la lógica de datos vive en los hooks de cada feature.

### Aliases de importación

Configurados en `tsconfig.app.json` y `vite.config.ts`:

- `@app/*`, `@pages/*`, `@features/*`, `@entities/*`, `@shared/*`

### Estado y data-fetching

- **Server state:** TanStack Query (queries/mutations) en `features/*/hooks.ts`, consumiendo `features/*/api.ts`.
- **Estado de sesión:** `AuthContext` en `features/auth/auth-context.tsx`.
- **Validación:** schemas `zod` en `entities/*/model.ts` (fuente única reutilizada por formularios).

### Code-splitting

Las páginas se cargan de forma perezosa (`React.lazy`) en `app/router.tsx` → el bundle principal no incluye las páginas.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
