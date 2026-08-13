# MTTO Fleet Manager — Frontend

SPA built with **React 19 + Vite + TypeScript + Tailwind 4 + TanStack Query + shadcn/ui**, deployed to **S3 + CloudFront**.

Stack: React 19, Vite 8, TypeScript 6, Tailwind 4, react-router 7, axios, zod, react-hook-form, recharts, lucide-react.

## Architecture (FSD — Feature-Sliced Design)

The application follows **Feature-Sliced Design** in its reduced variant. The code is organized in layers with **unidirectional dependencies** (from the top layer down):

```
app/       → pages/ → features/ → entities/ → shared/
```

| Layer | Content | Imports from |
|---|---|---|
| `app/` | Entry, providers, router, layouts, global styles | pages, features, entities, shared |
| `pages/` | One page per route (composition only) | features, entities, shared |
| `features/` | Business capabilities: `auth`, `vessels`, `components`, `maintenance`, `ai` — each with its own `api.ts`, `hooks.ts` and `model.ts` | entities, shared |
| `entities/` | Domain entities (`vessel`, `component`, `maintenance`) with types + zod schemas | shared |
| `shared/` | Reusable infrastructure: `api/` (axios client), `ui/` (shadcn), `lib/`, `contracts/` | (nothing) |

### Layer rules (convention, enforced in code review)

1. Dependencies flow **only downwards**: `app → pages → features → entities → shared`.
2. **No lower layer imports from a higher one** (e.g. `shared/` never imports from `features/`).
3. **Features do not import each other.** Communication between features happens via `entities/` or `shared/`.
4. Pages **only compose**; data logic lives in each feature's hooks.

### Import aliases

Configured in `tsconfig.app.json` and `vite.config.ts`:

- `@app/*`, `@pages/*`, `@features/*`, `@entities/*`, `@shared/*`

### State and data fetching

- **Server state:** TanStack Query (queries/mutations) in `features/*/hooks.ts`, consuming `features/*/api.ts`.
- **Session state:** `AuthContext` in `features/auth/auth-context.tsx`.
- **Validation:** `zod` schemas in `entities/*/model.ts` (single source reused by forms).

### Code-splitting

Pages are loaded lazily (`React.lazy`) in `app/router.tsx` → the main bundle does not include the pages. Rollup emits one chunk per route plus shared FSD/UI chunks, so the initial load only downloads `index.html` + entry + CSS and the rest loads on demand.

## Versions and Tooling

- Node.js **24** pinned via `.nvmrc` and `engines.node = ^24.0.0`; Docker image is `node:24-alpine`.
- Package manager: `pnpm 10` (`packageManager: pnpm@10.33.0`).
- Build: `tsc -b && vite build` (SWC via `@vitejs/plugin-react-swc`).

## Testing

- **Unit/component tests:** Vitest + Testing Library with **jsdom 30** (`testTimeout: 15000`, configured in `vite.config.ts`).
- **BDD tests:** jest-cucumber (`*.feature` + step definitions).
- Run: `pnpm test` (`vitest run`) or `pnpm test:coverage`. Coverage thresholds are 80% (statements, branches, functions, lines).

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