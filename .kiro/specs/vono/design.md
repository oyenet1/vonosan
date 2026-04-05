# Design Document: Vono Framework

## Overview

Vono (Vue + Hono) is a batteries-included full-stack TypeScript framework that unifies a Hono API backend with a Vue 3 frontend in a single codebase. It ships as a family of npm packages and codifies the Bonifade Technologies development standards into automated tooling.

The framework is composed of:
- `create-vono` — interactive project scaffolder
- `vono` — core runtime package (config, composables, Vite plugin, server/client helpers)
- `@vono/cli` — Artisan-style CLI for code generation, migrations, auditing, and git automation
- `@vono/drizzle` — Drizzle ORM integration (mixins, soft deletes, scopes, seed helpers)
- `@vono/auth`, `@vono/notifications`, `@vono/logging`, `@vono/ws` — optional add-on modules

Projects can be deployed to Node.js, Bun, Deno, Docker, Cloudflare Workers, and Vercel without code changes.

---

## Architecture

### High-Level Structure

```
create-vono (scaffolder)
    └── generates a Vono project
         ├── vono.config.ts          (defineVonoConfig)
         ├── vite.config.ts          (vono() Vite plugin)
         ├── src/
         │   ├── main.ts             (shared app factory)
         │   ├── app.ts              (outer Hono app)
         │   ├── server.ts           (SSR entry)
         │   ├── router.ts           (Vue Router setup)
         │   ├── route-rules.ts      (SSR/SPA/prerender rules)
         │   ├── App.vue
         │   ├── modules/            (feature modules)
         │   ├── shared/             (cross-cutting utilities)
         │   ├── db/                 (Drizzle schema, migrations, seeds)
         │   ├── lib/                (third-party wrappers)
         │   └── types/              (global TypeScript types)
         └── index.html
```

### Two-Layer Hono App

```
┌─────────────────────────────────────────────────────┐
│  Outer App (app.ts)                                  │
│  hono/logger · hono/pretty-json · hono/cors          │
│  GET /  (health)  GET /openapi.json  GET /docs       │
│  GET /reference   GET /fp/*                          │
│                                                      │
│  ┌───────────────────────────────────────────────┐   │
│  │  Inner API Router  (mounted at /api/v1)        │   │
│  │  configProvider · dbProvider                   │   │
│  │  autoRegisterRoutes() → feature modules        │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  SSR/SPA Handler (Vue rendering)                     │
└─────────────────────────────────────────────────────┘
```

### Package Dependency Graph

```
create-vono
  └── @clack/prompts, giget, kolorist, execa

vono (core)
  ├── vono/vite      → Vite plugin
  ├── vono/server    → SSR helpers, renderStream
  ├── vono/client    → composables (useAsyncData, useState, useCookie, etc.)
  └── vono/types     → shared TypeScript interfaces

@vono/cli
  └── depends on vono (core)

@vono/drizzle
  └── depends on vono (core)

@vono/auth | @vono/notifications | @vono/logging | @vono/ws
  └── each depends on vono (core)
```

### Rendering Pipeline

```
Request
  │
  ├─ API route? → Inner API Router → Module Controller → Service → DB
  │
  └─ Page route?
       │
       ├─ resolveRouteRule(path)
       │
       ├─ mode: 'ssr'  → renderToString / renderToWebStream
       │                  inject Pinia state, head tags
       │                  return full HTML
       │
       ├─ mode: 'spa'  → return bare HTML shell
       │                  X-Robots-Tag: noindex, nofollow
       │
       └─ mode: 'prerender' → static HTML at build time
```

---

## Components and Interfaces

### `create-vono` Scaffolder

Responsibilities:
- Launch interactive wizard via `@clack/prompts`
- Fetch project template via `giget`
- Render template files with user selections
- Run install command via `execa`
- Initialize git repo and create initial commit

Key behaviors:
- Validates target directory does not exist before writing
- Generates `.env` and `.env.example` with identical keys
- Writes `vono.config.ts` via `defineVonoConfig()`
- Generates `llms.txt` documenting architecture

### `@vono/cli` — Command Registry

| Command | Description |
|---|---|
| `vono make:module <name>` | Scaffold full module (routes, controller, service, dto, schema, pages, composables, tests, scopes) |
| `vono make:service/controller/dto/routes/schema/middleware/page/component/composable/store/migration/seed/test/notification/resource/policy/job/email/helper <name>` | Individual file generators |
| `vono make:version <v>` | New API version namespace |
| `vono add <module>` | Install optional add-on module |
| `vono add <module> --eject` | Copy module source into project |
| `vono migrate:make/run/rollback/status/reset/fresh` | Drizzle migration commands |
| `vono db:push/studio/seed` | Database utilities |
| `vono schema:sync` | Regenerate schema barrel file |
| `vono lint` | Run linter (headers, logs, naming, versioning, DRY) |
| `vono fix:headers` | Auto-inject missing file headers |
| `vono fix:logs` | Replace console.* with Logger |
| `vono audit [--fix]` | Full code audit |
| `vono env:add <KEY> <desc>` | Add env var to .env and .env.example |
| `vono branch:new/finish` | Git branch automation |
| `vono commit "<msg>"` | Conventional commit validator |
| `vono test [--clean]` | Run test suite |
| `vono jobs:run <name>` | Execute a cron job immediately |
| `vono upgrade [--check] [--apply-codemods]` | Version upgrade tooling |

### `vono` Core Runtime

#### Vite Plugin (`vono/vite`)

Composes internally:
- `@vitejs/plugin-vue`
- `vue-router/vite` (file-based routing from `src/modules/**/*.page.vue`)
- `unplugin-auto-import/vite`
- `unplugin-vue-components/vite`
- `@hono/vite-dev-server`
- `@nuxt/ui/vite`

Dual build output:
- `dist/client/` — client bundle
- `dist/server/` — SSR bundle

Generates type declaration files:
- `src/auto-imports.d.ts`
- `src/auto-imports-client.d.ts`
- `src/components.d.ts`

#### Config System (`defineVonoConfig`)

```typescript
interface VonoConfig {
  app: { name: string; url: string; env: string; key: string; language: 'ts' | 'js' }
  runtime: 'cloudflare-workers' | 'cloudflare-pages' | 'bun' | 'node' | 'deno' | 'aws-lambda' | 'vercel' | 'netlify' | 'fastly'
  mode: 'fullstack' | 'api'
  saas?: boolean
  cors?: CorsConfig
  rateLimit?: { auth?: RateLimitTier; otp?: RateLimitTier; api?: RateLimitTier }
  payment?: PaymentConfig
  docs?: { swagger: boolean; fiberplane: boolean; openapi: string }
  test?: { driver: 'bun' | 'vitest' | 'jest' }
  ui?: { colors: { primary: string; neutral: string } }
  modules?: VonoModule[]
  autoImport?: AutoImportConfig
  env?: { schema: ZodSchema; refine?: (env: any) => boolean }
}
```

#### Route Rules (`src/route-rules.ts`)

```typescript
interface RouteRule {
  mode: 'ssr' | 'spa' | 'prerender'
  cache?: number        // seconds
  swr?: boolean
}

type RouteRules = Record<string, RouteRule>
```

`resolveRouteRule(path)` — top-to-bottom first-match, supports exact and `/**` wildcard suffix.

### Shared Utilities (`src/shared/`)

| File | Export | Purpose |
|---|---|---|
| `response.ts` | `ApiResponse`, `success()`, `error()` | Standard API response formatter |
| `logger.ts` | `Logger` | Structured logging wrapper |
| `mappers.ts` | `toCamel(obj)` | Recursive snake_case → camelCase converter |
| `softDeletes.ts` | `withSoftDeletes`, `onlyTrashed`, `withTrashed`, `softDelete`, `forceDelete`, `restore` | Drizzle soft delete helpers |
| `pagination.ts` | `buildPaginationMeta(page, limit, total)` | Standard pagination meta builder |
| `id.ts` | `generateId()`, `prefixedId(prefix)` | ID generation utilities |
| `autoRoutes.ts` | `autoRegisterRoutes(app)` | Auto-discover and mount `*.routes.ts` files |

### Module Structure

Each feature module under `src/modules/<name>/` contains:

```
<name>/
  <name>.routes.ts        — Hono router, auto-registered
  <name>.controller.ts    — Request handlers
  <name>.service.ts       — Business logic
  <name>.dto.ts           — Zod validation schemas
  <name>.schema.ts        — Drizzle table definition
  <name>.resource.ts      — API response transformer
  <name>.policy.ts        — Authorization rules
  <name>.scopes.ts        — Reusable query conditions
  jobs/                   — Cron job definitions
  emails/                 — Email templates
  composables/            — Vue composables (full-stack only)
  *.page.vue              — Vue pages (full-stack only)
  tests/
    <name>.unit.test.ts
    <name>.integration.test.ts
    <name>.e2e.test.ts
```

### Authentication (`@vono/auth`)

Key components:
- JWT access tokens (15-min) + refresh tokens (7-day) via `hono/jwt`
- PBKDF2 password hashing via Web Crypto API
- `authMiddleware` — verifies JWT, loads roles, sets `c.var.account`
- `optionalAuthMiddleware` — silently continues as guest on invalid/missing token
- `isAdmin`, `isSuperAdmin` — role guard middleware (HTTP 403)
- `apiKeyOrJwtMiddleware` — accepts JWT or `vono_*` prefixed API key
- OAuth flows: Google, GitHub (redirect + callback)
- Magic link authentication
- OTP-based password reset (6-digit, stored as hash in `verification_code` table)
- Refresh token sessions stored as SHA-256 hashes in `auth_session` table

### WebSocket (`@vono/ws`)

Runtime adapter resolution via `@@ws-adapter` alias:
- Bun → `hono/bun`
- Node → `@hono/node-ws`
- Cloudflare Workers → `hono/cloudflare-workers`
- Deno → `hono/deno`

Client composable `useWebSocket(path)` provides reactive `messages`, `isConnected`, `send()`, `connect()`, `disconnect()` with auto-reconnect.

---

## Data Models

### Core TypeScript Interfaces

```typescript
// src/types/index.ts

interface AuthAccount {
  id: string
  email: string
  username: string
  currentRole: Role
  roles: Role[]
  status: string
  language: string
}

interface Env {
  HYPERDRIVE?: Hyperdrive
  DATABASE_URL: string
  JWT_SECRET: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  RESEND_API_KEY?: string
  ALLOWED_ORIGINS?: string
  // ... additional bindings
}

interface Config {
  // Same keys as Env but all non-undefined (validated by configProvider)
  DATABASE_URL: string
  JWT_SECRET: string
  // ...
}

interface AppVariables {
  config: Config
  db: DrizzleDb
  account: AuthAccount
  [key: string]: unknown
}

type Role = typeof ROLES[number]
const ROLES = ['user', 'admin', 'superadmin', 'staff', 'customer_care'] as const
```

### Standard API Response Shape

```typescript
// Success
{ success: true, message: string, data: T }

// Failure
{ success: false, message: string, errors?: Record<string, string> }

// Collection
{
  success: true,
  message: string,
  data: {
    items: T[],
    meta: {
      page: number
      page_size: number
      total_items: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
    }
  }
}
```

### Drizzle Schema Conventions

All tables must include:
```typescript
// Via timestamps mixin
created_at: timestamp('created_at').defaultNow().notNull()
updated_at: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull()

// Via softDeletable mixin (SaaS mode)
deleted_at: timestamp('deleted_at')
```

Naming: all table names and column names in `snake_case`. Indexes required on foreign keys, status, email, and slug columns.

### Route Rule Data Model

```typescript
interface RouteRule {
  mode: 'ssr' | 'spa' | 'prerender'
  cache?: number
  swr?: boolean
}

const defaultRule: RouteRule = { mode: 'ssr' }
```

### Pagination Meta

```typescript
interface PaginationMeta {
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}
```

### Vono Module Definition

```typescript
interface VonoModuleDefinition {
  name: string
  version: string
  requires?: string[]
  middleware?: MiddlewareHandler[]
  schemas?: DrizzleTable[]
  serverImports?: AutoImportEntry[]
  clientImports?: AutoImportEntry[]
  pages?: string[]
  components?: string[]
  routes?: Hono
  migrations?: string[]
  configSchema?: ZodSchema
  setup?: (config: VonoConfig) => void | Promise<void>
  hooks?: {
    'app:created'?: (app: Hono) => void
    'app:ready'?: (app: Hono) => void
    'build:before'?: () => void
    'build:after'?: () => void
    'routes:resolved'?: (routes: RouteRecord[]) => void
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Project scaffold produces required directory structure

*For any* valid project name, running the scaffolder SHALL produce a directory containing `src/modules/`, `src/shared/`, `src/db/`, `src/lib/`, and `src/types/`.

**Validates: Requirements 1.2**

---

### Property 2: .env and .env.example key parity

*For any* scaffolded project, the set of keys in `.env` SHALL equal the set of keys in `.env.example`.

**Validates: Requirements 1.4, 8.2, 8.3**

---

### Property 3: ApiResponse.success shape invariant

*For any* data value and message string, `ApiResponse.success(data, message)` SHALL return an object with `success === true`, the provided `message`, and the provided `data`.

**Validates: Requirements 4.1**

---

### Property 4: ApiResponse.failure shape invariant

*For any* message string and optional errors object, `ApiResponse.failure(message, errors)` SHALL return an object with `success === false`, the provided `message`, and the provided `errors` (if given).

**Validates: Requirements 4.2**

---

### Property 5: buildPaginationMeta correctness

*For any* total item count, page number, and page size, `buildPaginationMeta(page, limit, total)` SHALL return a meta object where `total_pages === Math.ceil(total / limit)`, `has_next === page < total_pages`, and `has_prev === page > 1`.

**Validates: Requirements 4.5, 39.3**

---

### Property 6: withSoftDeletes then withTrashed override

*For any* valid query, applying `withSoftDeletes` and then `withTrashed` SHALL produce the same result set as applying `withTrashed` alone (withTrashed overrides the soft-delete filter).

**Validates: Requirements 6.6**

---

### Property 7: toCamel idempotence

*For any* valid plain object, `toCamel(toCamel(obj))` SHALL produce the same result as `toCamel(obj)`.

**Validates: Requirements 14.5**

---

### Property 8: toCamel converts all snake_case keys

*For any* plain object with snake_case keys, `toCamel(obj)` SHALL return an object where every key is in camelCase and no snake_case keys remain at any nesting level.

**Validates: Requirements 14.4**

---

### Property 9: resolveRouteRule returns defaultRule for unmatched paths

*For any* URL path that does not match any pattern in `routeRules`, `resolveRouteRule(path)` SHALL return the `defaultRule`.

**Validates: Requirements 18.6**

---

### Property 10: resolveRouteRule first-match semantics

*For any* URL path that matches multiple patterns in `routeRules`, `resolveRouteRule(path)` SHALL return the rule associated with the first matching pattern (top-to-bottom order).

**Validates: Requirements 18.2**

---

### Property 11: Pinia state SSR round-trip

*For any* valid Pinia state object, serializing it on the server (to JSON, with `<` and `>` escaped) and deserializing it on the client SHALL produce an equivalent state object.

**Validates: Requirements 21.4**

---

### Property 12: useState SSR round-trip

*For any* valid serializable state value, storing it via `useState` on the server and reading it on the client SHALL produce an equivalent value.

**Validates: Requirements 37.6**

---

### Property 13: Email template render contains data values

*For any* valid email template data object, calling `template.render(data)` SHALL produce a `{ subject, html, text }` object where `html` contains the string representations of all data values.

**Validates: Requirements 43.6**

---

### Property 14: generateId returns valid UUID v4

*For any* call to `generateId()`, the returned value SHALL be a string matching the UUID v4 pattern `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.

**Validates: Requirements 48.3**

---

### Property 15: prefixedId prefix round-trip

*For any* non-empty prefix string, `prefixedId(prefix).split('_')[0]` SHALL equal the original prefix.

**Validates: Requirements 48.4**

---

### Property 16: Module scaffold produces all required files

*For any* valid module name, running `vono make:module <name>` with API support SHALL produce files at `src/modules/<name>/<name>.routes.ts`, `<name>.controller.ts`, `<name>.service.ts`, `<name>.dto.ts`, and `<name>.schema.ts`.

**Validates: Requirements 2.1, 2.2**

---

### Property 17: Scope composition produces single WHERE clause

*For any* combination of query scopes composed with `and()`, the result SHALL be a single Drizzle `SQL` condition containing all individual scope conditions without subqueries.

**Validates: Requirements 55.6**

---

## Error Handling

### API Error Responses

All errors use the standard `ApiResponse.failure()` shape. HTTP status codes:

| Scenario | Status |
|---|---|
| Validation failure | 422 |
| Unauthorized (no/invalid token) | 401 |
| Forbidden (insufficient role) | 403 |
| Not found | 404 |
| Rate limit exceeded | 429 |
| File too large | 413 |
| Unsupported media type | 415 |
| Unhandled server error | 503 |

### SSR Error Handling

1. All `renderToString` / `renderToWebStream` calls are wrapped in try/catch.
2. If `ssr.fallbackToSpa` is enabled, SSR errors fall back to the bare SPA shell.
3. An `error.vue` global error page receives `{ statusCode, message, stack (dev only), url }`.
4. If both SSR and error page rendering fail, a static HTML 500 page is served.
5. `createError({ statusCode, message })` and `clearError({ redirect? })` are available in page components.

### Environment Validation Errors

At startup, before accepting requests:
1. Zod validates all env vars defined in `vono.config.ts` `env.schema`.
2. On failure, a formatted error lists each failing variable with its Zod message.
3. Process exits immediately — no requests are served with invalid config.

### CLI Error Handling

- Directory/module already exists → descriptive error, halt, no file modifications.
- Uncommitted changes on `vono branch:finish` → error, halt.
- Non-conforming commit message → descriptive error with format examples.
- Incompatible driver/runtime combination → descriptive error listing supported drivers.
- Shutdown handler errors → log error, `process.exit(1)`.

### Database Error Handling

- `dbProvider` wraps the request in try/finally, always closing the connection.
- Transactions: `tx.rollback()` rolls back all operations in the transaction.
- Service methods accept `dbOrTx: DrizzleDB | DrizzleTransaction` for composability.

---

## Testing Strategy

### Dual Testing Approach

Unit tests cover specific examples, edge cases, and error conditions. Property-based tests verify universal properties across all inputs. Both are required for comprehensive coverage.

### Property-Based Testing

The framework uses a property-based testing library appropriate for the target language (e.g., `fast-check` for TypeScript). Each property test runs a minimum of 100 iterations.

Each property test is tagged with a comment referencing the design property:
```
// Feature: vono, Property N: <property_text>
```

Properties to implement as PBT tests:
- Property 2: .env/.env.example key parity
- Property 3: ApiResponse.success shape invariant
- Property 4: ApiResponse.failure shape invariant
- Property 5: buildPaginationMeta correctness
- Property 6: withSoftDeletes then withTrashed override
- Property 7: toCamel idempotence
- Property 8: toCamel converts all snake_case keys
- Property 9: resolveRouteRule returns defaultRule for unmatched paths
- Property 10: resolveRouteRule first-match semantics
- Property 11: Pinia state SSR round-trip
- Property 12: useState SSR round-trip
- Property 13: Email template render contains data values
- Property 14: generateId returns valid UUID v4
- Property 15: prefixedId prefix round-trip
- Property 16: Module scaffold produces all required files
- Property 17: Scope composition produces single WHERE clause

### Unit Tests

Focus areas:
- `ApiResponse.success()` and `ApiResponse.failure()` with concrete examples
- `buildPaginationMeta()` edge cases (0 items, 1 page, last page)
- `toCamel()` with nested objects, arrays, and mixed-case keys
- `resolveRouteRule()` with exact matches, wildcard matches, and no match
- `generateId()` and `prefixedId()` format validation
- `withSoftDeletes`, `onlyTrashed`, `withTrashed` condition generation
- Header_Generator output format
- Conventional commit message validation
- Rate limiter tier configuration parsing
- `defineVonoConfig()` validation and error messages

### Integration Tests

Focus areas:
- Full module scaffold: verify all files created with correct content and headers
- `autoRegisterRoutes()`: verify routes are mounted at correct paths
- `configProvider` + `dbProvider` middleware chain
- Auth middleware: JWT verification, role loading, `c.var.account` population
- `vono env:add`: verify both `.env` and `.env.example` are updated
- `vono migrate:make`: verify schema sync runs before migration generation
- Linter: header violations, console.log violations, naming violations
- Auditor: exit code 0 on clean, exit code 1 on violations

### End-to-End Tests

Focus areas:
- Full project scaffold via `create-vono` wizard
- SSR page rendering: HTML contains head tags, Pinia state script, rendered content
- SPA page rendering: bare HTML shell, `X-Robots-Tag` header present
- API endpoint: request → controller → service → DB → standard response shape
- Auth flow: register → login → access protected route → refresh token
- Rate limiting: exceed limit → 429 response with correct message
- File upload: valid file → 200; oversized file → 413; wrong MIME → 415

### Test Configuration

```json
// package.json (default)
{
  "scripts": {
    "test": "bun test"
  }
}
```

Vitest and Jest are available as alternatives via the project wizard (`vono.config.ts` `test.driver`).
