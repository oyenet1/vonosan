# Implementation Tasks

## Task List

- [x] 1. Set up monorepo workspace structure
  - [x] 1.1 Initialize the monorepo root with `package.json` (workspaces), `tsconfig.base.json`, and `.gitignore`
  - [x] 1.2 Create package directories: `packages/create-vono`, `packages/vono`, `packages/cli`, `packages/drizzle`, `packages/auth`, `packages/notifications`, `packages/logging`, `packages/ws`
  - [x] 1.3 Write `package.json` for each package with correct name, version, exports, and peer dependencies
  - [x] 1.4 Configure TypeScript project references across packages

- [x] 2. Implement `src/shared/` core utilities
  - [x] 2.1 Implement `response.ts` — `ApiResponse` class with `success()` and `failure()` static methods plus `success()` and `error()` helper aliases
  - [x] 2.2 Implement `pagination.ts` — `buildPaginationMeta(page, limit, total)` returning the standard `PaginationMeta` shape
  - [x] 2.3 Implement `mappers.ts` — `toCamel(obj)` recursive snake_case → camelCase converter
  - [x] 2.4 Implement `softDeletes.ts` — `withSoftDeletes`, `onlyTrashed`, `withTrashed`, `restore`, `softDelete`, `forceDelete` helpers
  - [x] 2.5 Implement `id.ts` — `generateId()` (crypto.randomUUID) and `prefixedId(prefix)` utilities
  - [x] 2.6 Implement `autoRoutes.ts` — `autoRegisterRoutes(app)` using `import.meta.glob` to discover `*.routes.ts` files
  - [x] 2.7 Implement `logger.ts` — structured Logger wrapper (no raw console.log)

- [x] 3. Implement property-based tests for core utilities
  - [x] 3.1 Write PBT for `ApiResponse.success` shape invariant (Property 3)
  - [x] 3.2 Write PBT for `ApiResponse.failure` shape invariant (Property 4)
  - [x] 3.3 Write PBT for `buildPaginationMeta` correctness (Property 5)
  - [x] 3.4 Write PBT for `withSoftDeletes` + `withTrashed` override (Property 6)
  - [x] 3.5 Write PBT for `toCamel` idempotence (Property 7)
  - [x] 3.6 Write PBT for `toCamel` converts all snake_case keys (Property 8)
  - [x] 3.7 Write PBT for `generateId` returns valid UUID v4 (Property 14)
  - [x] 3.8 Write PBT for `prefixedId` prefix round-trip (Property 15)

- [x] 4. Implement `vono` core runtime package
  - [x] 4.1 Implement `defineVonoConfig(config)` with full `VonoConfig` interface and Zod validation
  - [x] 4.2 Implement `useVonoConfig()` composable (strips server-only values on client)
  - [x] 4.3 Implement `env()`, `envNumber()`, `envBool()`, `envRequired()` config helper functions
  - [x] 4.4 Implement `configProvider` middleware (reads env vars, validates, sets `c.var.config`)
  - [x] 4.5 Implement `dbProvider` middleware (creates Drizzle client, sets `c.var.db`, closes in finally)
  - [x] 4.6 Define `AuthAccount`, `Env`, `Config`, `AppVariables` TypeScript interfaces in `vono/types`
  - [x] 4.7 Define `ROLES` const array and `Role` type

- [x] 5. Implement route rules and SSR/SPA rendering
  - [x] 5.1 Implement `resolveRouteRule(path)` with first-match semantics and `/**` wildcard support
  - [x] 5.2 Write PBT for `resolveRouteRule` returns defaultRule for unmatched paths (Property 9)
  - [x] 5.3 Write PBT for `resolveRouteRule` first-match semantics (Property 10)
  - [x] 5.4 Implement SSR rendering path using `renderToString` with Pinia state injection and head tag injection
  - [x] 5.5 Implement SPA rendering path returning bare HTML shell with `X-Robots-Tag: noindex, nofollow`
  - [x] 5.6 Implement streaming SSR via `renderStream(url)` using `renderToWebStream` and Hono's `stream()` helper
  - [x] 5.7 Implement SSR error handling: try/catch around renderToString, fallback to SPA shell, static 500 fallback

- [x] 6. Implement Pinia SSR state hydration
  - [x] 6.1 Implement server-side Pinia state serialization into `<script id="__pinia">` with XSS escaping
  - [x] 6.2 Implement client-side Pinia state hydration from `#__pinia` script element
  - [x] 6.3 Write PBT for Pinia state SSR round-trip (Property 11)

- [x] 7. Implement client composables (`vono/client`)
  - [x] 7.1 Implement `useAsyncData(key, fetcher, options?)` with SSR fetch + client hydration (no duplicate fetch)
  - [x] 7.2 Implement `useVonoFetch(url, options?)` typed fetch wrapper (relative on server, absolute on client)
  - [x] 7.3 Implement `useCookie(name, options?)` SSR-safe cookie read/write
  - [x] 7.4 Implement `useState(key, init?)` with SSR payload serialization via `window.__VONO_STATE__`
  - [x] 7.5 Implement `navigateTo(path, options?)` with SSR 302 redirect support
  - [x] 7.6 Write PBT for `useState` SSR round-trip (Property 12)
  - [x] 7.7 Implement `useSeo(options)` composable setting title, meta, OG tags, Twitter Card, canonical, JSON-LD, noIndex
  - [x] 7.8 Implement `useRouteRules()` and `useFormErrors()` composables
  - [x] 7.9 Implement `<ClientOnly>` component with `#fallback` slot

- [x] 8. Implement Vite plugin (`vono/vite`)
  - [x] 8.1 Compose internal plugins: `@vitejs/plugin-vue`, `vue-router/vite`, `unplugin-auto-import/vite`, `unplugin-vue-components/vite`, `@hono/vite-dev-server`, `@nuxt/ui/vite`
  - [x] 8.2 Configure file-based routing scanning `src/modules/**/*.page.vue` with dynamic param conventions (`[id]`, `[[id]]`, `[...slug]`)
  - [x] 8.3 Configure dual build output: `dist/client/` and `dist/server/`
  - [x] 8.4 Generate `src/auto-imports.d.ts`, `src/auto-imports-client.d.ts`, `src/components.d.ts`
  - [x] 8.5 Configure `@@ws-adapter` alias resolution based on deployment target
  - [x] 8.6 Implement hot-reload for API route files via `ssrLoadModule` on change
  - [x] 8.7 Trigger full dev server restart on `vono.config.ts` changes
  - [x] 8.8 Configure auto-imports: server-side (Hono, Drizzle operators, Zod, shared utils) and client-side (Vue, Vue Router, Pinia)

- [x] 9. Implement two-layer Hono app architecture
  - [x] 9.1 Generate outer Hono app with `hono/logger`, `hono/pretty-json`, `hono/cors`, and `GET /` health check
  - [x] 9.2 Generate inner API router with `configProvider`, `dbProvider`, and `autoRegisterRoutes()`
  - [x] 9.3 Mount inner API router at `/api/v1` on the outer app
  - [x] 9.4 Implement CORS configuration reading from `vono.config.ts` and `ALLOWED_ORIGINS` env var
  - [x] 9.5 Implement `GET /openapi.json`, `GET /docs` (Swagger UI), `GET /reference` (Scalar), `GET /fp/*` (Fiberplane) endpoints
  - [x] 9.6 Generate `src/modules/health/health.routes.ts` with `GET /health` returning `{ status: 'ok', timestamp }`
  - [x] 9.7 Implement `GET /robots.txt` and `GET /sitemap.xml` endpoints

- [x] 10. Implement database layer (`@vono/drizzle`)
  - [x] 10.1 Implement `timestamps` Drizzle mixin (`created_at`, `updated_at`)
  - [x] 10.2 Implement `softDeletable` Drizzle mixin (`deleted_at`)
  - [x] 10.3 Implement `createDb(connectionString)` factory returning `{ db, client }`
  - [x] 10.4 Implement connection pooling: shared pool (Node/Bun), per-request Hyperdrive (CF Workers), HTTP serverless driver (Vercel/Deno)
  - [x] 10.5 Implement `src/db/relations.ts` scaffold for cross-module Drizzle relations
  - [x] 10.6 Implement `src/db/schema.ts` barrel file auto-generation

- [x] 11. Implement Zod validation middleware
  - [x] 11.1 Implement `zodValidator(target, schema)` middleware factory returning 422 with standard error shape
  - [x] 11.2 Implement `QuerySchema` Zod schema with `page`, `limit`, `q`, `sortBy`, `sortOrder`, `category`, `fields`

- [x] 12. Implement rate limiting middleware
  - [x] 12.1 Implement `rateLimiter.ts` with lazy-init pattern (defers setInterval to first request for CF Workers compatibility)
  - [x] 12.2 Export `authRateLimiter`, `otpRateLimiter`, `apiRateLimiter` with configurable tiers from `vono.config.ts`
  - [x] 12.3 Return HTTP 429 with standard error response on limit exceeded

- [x] 13. Implement Header Generator and Linter
  - [x] 13.1 Implement `Header_Generator` that produces the Bonifade Technologies header comment with company, developer, GitHub, created date, updated date
  - [x] 13.2 Implement `vono lint` command scanning `.ts` and `.vue` files under `src/` for header violations, console.log violations, naming violations, versioning violations, and DRY violations
  - [x] 13.3 Implement `vono fix:headers` command injecting missing headers without modifying other content
  - [x] 13.4 Implement `vono fix:logs` command replacing `console.*` calls with Logger equivalents
  - [x] 13.5 Implement `vono audit [--fix]` command with exit code 0 (clean) or 1 (violations)

- [x] 14. Implement environment variable sync
  - [x] 14.1 Implement `vono env:add <KEY> <description>` appending key to both `.env` and `.env.example`
  - [x] 14.2 Implement linter check comparing `.env` and `.env.example` keys for parity
  - [x] 14.3 Write PBT for `.env`/`.env.example` key parity (Property 2)

- [x] 15. Implement git and version control automation
  - [x] 15.1 Implement `vono branch:new <feature-name>` recording parent branch and creating `feature/<name>`
  - [x] 15.2 Implement `vono branch:finish` merging into parent, deleting feature branch, checking for uncommitted changes
  - [x] 15.3 Implement `vono commit "<message>"` validating Conventional Commits format

- [x] 16. Implement database migration CLI commands
  - [x] 16.1 Implement `vono migrate:run`, `migrate:rollback`, `migrate:status`, `migrate:reset`, `migrate:fresh --seed`
  - [x] 16.2 Implement `vono migrate:make <name>` (runs `schema:sync` first, then Drizzle Kit generator)
  - [x] 16.3 Implement `vono db:push`, `db:studio`, `db:seed [name]`
  - [x] 16.4 Implement `vono schema:sync` scanning `*.schema.ts` files and regenerating `src/db/schema.ts` barrel

- [x] 17. Implement module code generators (`@vono/cli`)
  - [x] 17.1 Implement `vono make:module <name>` generating routes, controller, service, dto, schema, resource, policy, scopes, tests, and (full-stack) pages and composables
  - [x] 17.2 Implement individual file generators: `make:service`, `make:controller`, `make:dto`, `make:routes`, `make:schema`, `make:middleware`, `make:page`, `make:component`, `make:composable`, `make:store`, `make:migration`, `make:seed`, `make:test`, `make:notification`, `make:resource`, `make:policy`, `make:job`, `make:email`, `make:helper`
  - [x] 17.3 Implement `vono make:version <v>` generating new API version namespace without modifying existing versions
  - [x] 17.4 Implement `vono add <module>` installing package, generating files, updating `vono.config.ts` (idempotent)
  - [x] 17.5 Implement `vono add <module> --eject` copying module source into `src/modules/<module>/`
  - [x] 17.6 Write PBT for module scaffold produces all required files (Property 16)

- [x] 18. Implement authorization system (Gates & Policies)
  - [x] 18.1 Implement `authorize(user, ability, resource?)` throwing HTTP 403 and `can(user, ability, resource?)` returning boolean
  - [x] 18.2 Implement Gate registry in `src/shared/gates/index.ts` and Policy registry in `src/shared/policies/index.ts`
  - [x] 18.3 Implement `gate(ability)` and `policy(ability)` middleware factories for route definitions

- [x] 19. Implement Resource transformers
  - [x] 19.1 Implement Resource base with `static toResource(item, fields?)` and `static toCollection(items, total, page, limit)` methods
  - [x] 19.2 Implement `resolveStorageUrl(path, config?)` utility in `src/shared/utils/storage.ts`

- [x] 20. Implement `@vono/auth` module
  - [x] 20.1 Scaffold auth routes, controller, service, DTO, schema (accounts, auth_session, verification_code tables)
  - [x] 20.2 Implement JWT access tokens (15-min) + refresh tokens (7-day) using `hono/jwt` and PBKDF2 via Web Crypto API
  - [x] 20.3 Implement `authMiddleware`, `optionalAuthMiddleware`, `isAdmin`, `isSuperAdmin`, `apiKeyOrJwtMiddleware`
  - [x] 20.4 Implement OAuth flows for Google and GitHub (redirect + callback endpoints)
  - [x] 20.5 Implement magic link authentication
  - [x] 20.6 Implement OTP-based password reset (6-digit OTP, hashed storage, email delivery)
  - [x] 20.7 Scaffold frontend pages: login, register, forgot-password, reset-password, and `useAuth` composable

- [x] 21. Implement `@vono/notifications` module
  - [x] 21.1 Generate `notifications` and `notification_preferences` Drizzle schemas
  - [x] 21.2 Implement notification service, controller, and routes (list, mark read, mark all read, delete, get/update preferences)
  - [x] 21.3 Implement async queue dispatch with synchronous fallback

- [x] 22. Implement `@vono/logging` module
  - [x] 22.1 Generate `activity_logs` Drizzle schema
  - [x] 22.2 Implement logging service with queue dispatch and synchronous fallback
  - [x] 22.3 Implement admin API endpoint for querying activity logs with filtering

- [x] 23. Implement `@vono/ws` module
  - [x] 23.1 Implement `@@ws-adapter` alias resolution for Bun, Node, CF Workers, Deno
  - [x] 23.2 Implement Socket.IO support for Bun/Node targets with runtime guard
  - [x] 23.3 Implement `useWebSocket(path)` Vue composable with reactive state and auto-reconnect
  - [x] 23.4 Warn on serverless targets that Socket.IO is unsupported

- [x] 24. Implement email template system
  - [x] 24.1 Implement `defineEmail({ subject, html, text })` function
  - [x] 24.2 Implement `sendEmail(c, options)` supporting Resend, Postmark, SMTP, and Console drivers
  - [x] 24.3 Implement queue-based async email dispatch when `queue: true`
  - [x] 24.4 Write PBT for email template render contains data values (Property 13)

- [x] 25. Implement cron / scheduled jobs
  - [x] 25.1 Implement `defineJob({ name, schedule, description, handler })` function
  - [x] 25.2 Implement `node-cron` runner for Node/Bun targets
  - [x] 25.3 Generate `[triggers]` in `wrangler.jsonc` for CF Workers targets
  - [x] 25.4 Generate `vercel.json` crons config for Vercel targets
  - [x] 25.5 Implement `vono jobs:run <name>` for immediate job execution

- [x] 26. Implement file uploads and storage abstraction
  - [x] 26.1 Implement `useStorage(c)` returning storage client with `upload()`, `delete()`, `url()` methods
  - [x] 26.2 Implement `local`, `r2`, `s3`, `cloudinary`, `bunny` storage drivers
  - [x] 26.3 Return HTTP 413 on oversized uploads and HTTP 415 on disallowed MIME types

- [x] 27. Implement i18n module (`@vono/i18n`)
  - [x] 27.1 Implement locale detection strategies: `prefix`, `cookie`, `header`
  - [x] 27.2 Implement lazy-loading of `src/locales/<locale>.json` translation files
  - [x] 27.3 Implement `useI18n()` composable and server-side `getLocale(c)` / `t(locale, key)` helpers

- [x] 28. Implement layout system
  - [x] 28.1 Auto-discover layout components from `src/shared/layouts/`
  - [x] 28.2 Scaffold `default.vue`, `dashboard.vue`, `auth.vue` layouts during project creation
  - [x] 28.3 Implement `resolveLayout(layoutName)` utility from `vono/client`
  - [x] 28.4 Support `layout: 'blank'` and missing layout rendering page without wrapper

- [x] 29. Implement SEO endpoints
  - [x] 29.1 Implement `GET /robots.txt` blocking `/dashboard`, `/admin`, `/settings`, `/api` and referencing sitemap
  - [x] 29.2 Implement `GET /sitemap.xml` generating valid XML sitemap for SSR-mode public pages
  - [x] 29.3 Set `Cache-Control: public, max-age=31536000, immutable` for hashed static assets in production

- [x] 30. Implement deployment target configurations
  - [x] 30.1 Generate `ecosystem.config.js` for Bun (`fork` mode) and Node.js (`cluster` mode) with PM2 log and restart policies
  - [x] 30.2 Generate multi-stage Dockerfile for Docker (Bun) using `oven/bun:1` and Docker (Node) using `node:22-alpine` with HEALTHCHECK and `EXPOSE 4000`
  - [x] 30.3 Generate `docker-compose.yml` with `app` + `redis` services and `wait-for-redis.sh` when Redis queue is selected
  - [x] 30.4 Generate `wrangler.jsonc` for Cloudflare Workers with Hyperdrive, KV, R2, Queue bindings, and cron triggers
  - [x] 30.5 Generate `set-secrets.sh` script for Cloudflare Workers secrets upload
  - [x] 30.6 Implement graceful shutdown handler for `SIGINT` closing DB connections and queue connections

- [x] 31. Implement runtime auto-resolution
  - [x] 31.1 Implement `resolveQueueDriver(config)`, `resolveStorageDriver(config)`, `resolveCacheDriver(config)` in `src/shared/resolvers/`
  - [x] 31.2 Throw descriptive error at startup for incompatible driver/runtime combinations

- [x] 32. Implement `create-vono` scaffolder
  - [x] 32.1 Build interactive wizard using `@clack/prompts` covering all wizard options (language, project type, package manager, deployment target, database, queue, cache, email, storage, WebSocket, notifications, logging, auth, password reset, roles, testing, API docs)
  - [x] 32.2 Fetch project template via `giget` and render with user selections
  - [x] 32.3 Generate standard folder structure, `vono.config.ts`, `vite.config.ts`, `drizzle.config.ts`, `.env`, `.env.example`, `llms.txt`, `index.html`, `src/App.vue`, and entry files
  - [x] 32.4 Run install command via `execa` and initialize git repo with initial commit `chore: initial project scaffold`
  - [x] 32.5 Validate target directory does not exist before writing any files
  - [x] 32.6 Enable SaaS mode when `--saas` flag or wizard selection sets it in `vono.config.ts`

- [x] 33. Implement upgrade and versioning tooling
  - [x] 33.1 Implement `vono upgrade --check` reporting available updates for `vono`, `@vono/cli`, and installed `@vono/*` modules
  - [x] 33.2 Implement `vono upgrade --apply-codemods` running automated codemods for major version upgrades

- [x] 34. Implement OpenAPI spec generation
  - [x] 34.1 Generate `src/openapi.ts` with OpenAPI 3.1 spec object including `info`, `servers`, `tags`, `components.securitySchemes`, `components.schemas`
  - [x] 34.2 Auto-append tag entry to `src/openapi.ts` when `vono make:module` is run

- [x] 35. Implement testing scaffold and test runner
  - [x] 35.1 Configure `bun test` as default test runner in `package.json` with Vitest and Jest as wizard alternatives
  - [x] 35.2 Implement `vono test` command executing the configured test runner
  - [x] 35.3 Implement `vono test:clean` deleting `**/*.test.ts` files only after all tests pass

- [x] 36. Implement Nuxt UI SSR integration
  - [x] 36.1 Configure `@nuxt/ui/vue-plugin` in `src/main.ts` via `app.use(ui)`
  - [x] 36.2 Add `class="isolate"` to `#app` div in `index.html`
  - [x] 36.3 Pass `ui.colors` from `vono.config.ts` to `@nuxt/ui/vite` plugin
  - [x] 36.4 Wrap `<RouterView />` in `<UApp>` in generated `src/App.vue`

- [x] 37. Implement Module/Plugin system
  - [x] 37.1 Implement `defineVonoModule(definition)` accepting all module definition fields
  - [x] 37.2 Implement Vite plugin integration to merge module schemas, routes, auto-imports, and pages at build time
  - [x] 37.3 Implement module lifecycle hooks: `app:created`, `app:ready`, `build:before`, `build:after`, `routes:resolved`

- [x] 38. Implement environment validation at startup
  - [x] 38.1 Implement `defineEnv(schema)` helper wrapping Zod env validation returning typed config
  - [x] 38.2 Validate all env vars at startup before accepting requests; print formatted error and exit on failure
  - [x] 38.3 Support cross-field validation via `env.refine` function

- [x] 39. Write integration and end-to-end tests
  - [x] 39.1 Integration tests: module scaffold file creation, `autoRegisterRoutes`, middleware chain, auth middleware, env:add, migrate:make, linter checks
  - [x] 39.2 E2E tests: full project scaffold via `create-vono`, SSR page rendering, SPA page rendering, API endpoint flow, auth flow, rate limiting, file upload edge cases
