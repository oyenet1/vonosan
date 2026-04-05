# Requirements Document

## Introduction

Vono (Vue + Hono) is a batteries-included full-stack TypeScript framework that combines a Hono API backend with a Vue 3 frontend in a single codebase. It ships as multiple npm packages, supports hybrid SSR/SPA rendering, file-based routing, Drizzle ORM integration, and a Laravel-style CLI. Projects can be deployed anywhere Hono runs: Node.js, Bun, Deno, Docker, Cloudflare Workers, and Vercel.

The framework is not a runtime library alone — it is a complete developer toolchain: a project scaffolder (`create-vono`), a core runtime package (`vono`), an Artisan-style CLI (`@vono/cli`), and a suite of optional add-on modules (`@vono/auth`, `@vono/drizzle`, `@vono/notifications`, `@vono/logging`, `@vono/ws`). It codifies the Bonifade Technologies development standards into automated tooling so every project starts and stays consistent.

---

## Glossary

- **Framework**: The Vono framework — its CLI tools, runtime packages, Vite plugin, and code generators.
- **CLI**: The command-line interface entry point (`vono`) used to invoke all framework commands.
- **Project**: A full-stack or API-only application scaffolded or managed by the Framework.
- **Module**: A self-contained feature folder within a Project containing routes, controller, service, DTO, schema, pages, components, and composables.
- **Scaffold**: The act of generating a new Project or Module from a template with all required boilerplate.
- **Header_Generator**: The component responsible for injecting the standard file header comment into every generated or edited file.
- **Response_Formatter**: The shared utility (`ApiResponse` class and `success()`/`error()` helpers) that produces the standard API response payload (`success`, `message`, `data`).
- **Schema**: A Drizzle ORM table definition file within a Module.
- **Migration**: A Drizzle ORM database migration file generated from Schema changes.
- **Linter**: The Framework component that statically analyzes project files for standard violations.
- **Auditor**: The Framework component that performs post-write self-audits on generated or modified files.
- **Env_Sync**: The Framework behavior that keeps `.env` and `.env.example` in sync whenever environment variables are added or changed.
- **Soft_Delete_Helper**: The shared Drizzle ORM utility (`withSoftDeletes`, `onlyTrashed`, `withTrashed`) that filters soft-deleted records.
- **Paginator**: The shared utility (`buildPaginationMeta`) that produces the standard `meta` pagination object for collection responses.
- **Version**: An API version namespace (e.g., `v1`, `v2`) used to organize routes, controllers, and schemas.
- **SaaS_Mode**: A project configuration flag that enables SaaS-specific requirements such as soft deletes on every table.
- **Logger**: A structured logging utility used in place of raw `console.log`.
- **Vue_Router**: Vue Router v5 used for client-side and SSR routing with file-based route discovery.
- **SSR**: Server-Side Rendering — the server renders the Vue app to HTML before sending to the client.
- **SPA**: Single-Page Application mode — the server sends a bare HTML shell; Vue renders entirely on the client.
- **Route_Rules**: The `src/route-rules.ts` configuration that maps URL patterns to rendering modes (`ssr`, `spa`, `prerender`).
- **Vite_Plugin**: The `vono/vite` Vite plugin that wires SSR, file-based routing, auto-imports, dev server, and HMR.
- **Module_System**: The `defineVonoModule()` API for creating installable Vono modules that register middleware, schemas, routes, pages, and composables.
- **Vono_Config**: The `vono.config.ts` project configuration file, defined via `defineVonoConfig()`.
- **Auto_Import**: The `unplugin-auto-import` integration that makes shared utilities, composables, and framework APIs available without explicit import statements.
- **Resource**: An API response transformer class with `toResource()` and `toCollection()` static methods.
- **Policy**: A resource-level authorization class defining per-action rules for a module.
- **Gate**: A simple boolean authorization check (no resource) registered globally.
- **Cron_Job**: A scheduled task defined with `defineJob()` that runs on a cron schedule.
- **Email_Template**: A TypeScript function defined with `defineEmail()` that returns a subject, HTML body, and plain-text body.
- **Storage_Driver**: An abstraction over file storage backends (local, R2, S3, Cloudinary, Bunny.net).
- **AuthAccount**: The TypeScript interface representing an authenticated user on `c.var.account`.
- **AppVariables**: The TypeScript interface defining what lives on `c.var` (config, db, account).
- **configProvider**: Middleware that reads env vars from `c.env` (CF Workers) or `process.env` (Node/Bun) and sets `c.var.config`.
- **dbProvider**: Middleware that creates a per-request (or pooled) Drizzle client and sets `c.var.db`.
- **autoRegisterRoutes**: The utility that auto-discovers `*.routes.ts` files and mounts them on the Hono app.

---

## Requirements

### Requirement 1: Project Scaffolding

**User Story:** As a developer, I want to scaffold a new full-stack project using a single CLI command, so that the project starts with the correct structure, tooling, and configuration already in place.

#### Acceptance Criteria

1. WHEN the developer runs `bun create vono@latest <project-name>`, THE CLI SHALL launch an interactive wizard that prompts for: language (TypeScript/JavaScript), project type (full-stack/API-only), package manager, deployment target, database, queue driver, cache driver, email provider, file storage, WebSocket support, notifications, logging, auth scaffolding, password reset method, roles, testing framework, and API docs.
2. WHEN scaffolding a new project, THE CLI SHALL generate the standard Modular Monolith folder structure (`src/modules/`, `src/shared/`, `src/db/`, `src/lib/`, `src/types/`).
3. WHEN scaffolding a new project, THE CLI SHALL initialize the project with TypeScript (strict mode), Bun as the default package manager, and Drizzle ORM as the default ORM.
4. WHEN scaffolding a new project, THE CLI SHALL generate a `.env` file and a corresponding `.env.example` file with identical keys and placeholder values.
5. WHEN scaffolding a new project, THE CLI SHALL generate a `package.json` with all required dependencies installed at their latest versions (not pinned).
6. WHEN scaffolding a new project, THE CLI SHALL create a `drizzle.config.ts` file pre-configured for the project's database connection.
7. WHEN scaffolding a new project, THE CLI SHALL create a `vono.config.ts` file at the project root using `defineVonoConfig()`.
8. WHEN scaffolding a new project, THE CLI SHALL create a root `llms.txt` file documenting the project's architecture, module list, and technology stack.
9. WHEN the developer passes a `--saas` flag or selects SaaS mode in the wizard, THE CLI SHALL enable SaaS_Mode for the project, recording this in `vono.config.ts`.
10. IF the target project directory already exists, THEN THE CLI SHALL return an error message and halt without modifying any existing files.
11. WHEN scaffolding a full-stack project, THE CLI SHALL generate `src/main.ts`, `src/app.ts`, `src/server.ts`, `src/router.ts`, `src/route-rules.ts`, `src/App.vue`, and `index.html`.
12. WHEN scaffolding a full-stack project, THE CLI SHALL install Vue 3, Vue Router v5, Pinia, `@nuxt/ui`, and `@unhead/vue` as dependencies.
13. WHEN the developer selects JavaScript in the wizard, THE CLI SHALL generate `.js` files with JSDoc type annotations, a `jsconfig.json` instead of `tsconfig.json`, and omit `typescript` and `vue-tsc` from dev dependencies.
14. WHEN installing dependencies, THE CLI SHALL install all packages at their `@latest` version rather than pinned versions.

---

### Requirement 2: Module Generation

**User Story:** As a developer, I want to generate a new feature module with a single command, so that I get consistent boilerplate without manually creating files.

#### Acceptance Criteria

1. WHEN the developer runs `vono make:module <module-name>`, THE CLI SHALL prompt for which parts to generate (API files, pages, composables, components) and create the selected files under `src/modules/<module-name>/`.
2. WHEN generating a module with API support, THE CLI SHALL create `<module>.routes.ts`, `<module>.controller.ts`, `<module>.service.ts`, `<module>.dto.ts`, and `<module>.schema.ts`.
3. WHEN generating a module with frontend support, THE CLI SHALL create `index.page.vue` and a `composables/use<ModuleName>.ts` file inside the module folder.
4. WHEN generating a module with API support, THE CLI SHALL auto-register the module's routes via `autoRegisterRoutes()` — no manual router registration is required.
5. WHEN generating a module with API support, THE CLI SHALL auto-import the module's schema into `src/db/schema.ts` barrel file.
6. WHEN generating a module in a SaaS_Mode project, THE CLI SHALL include a `deleted_at` nullable timestamp column in the generated Schema.
7. WHEN generating a module, THE CLI SHALL include `created_at` and `updated_at` timestamp columns in the generated Schema.
8. WHEN generating a module, THE CLI SHALL inject the standard file header comment (via Header_Generator) into every generated file.
9. IF a module with the same name already exists, THEN THE CLI SHALL return an error and halt without overwriting existing files.
10. THE Framework SHALL generate a `src/db/seeds/` directory during project scaffolding for database seed scripts, and `vono make:seed <name>` SHALL generate a seed file in that directory.
11. THE CLI SHALL support individual file generators: `vono make:service <name>`, `vono make:controller <name>`, `vono make:dto <name>`, `vono make:routes <name>`, `vono make:schema <name>`, `vono make:middleware <name>`, `vono make:page <module/PageName>`, `vono make:component <module/ComponentName>`, `vono make:composable <module/useComposable>`, `vono make:store <name>`, `vono make:migration <name>`, `vono make:seed <name>`, `vono make:test <name>`, and `vono make:notification <name>` — each generating only the specified file type in the appropriate location.

---

### Requirement 3: File Header Enforcement

**User Story:** As a developer, I want every file in the project to carry the standard Bonifade header comment, so that authorship and metadata are always traceable.

#### Acceptance Criteria

1. THE Header_Generator SHALL produce a header comment containing: company name (Bonifade Technologies), developer name (Bowofade Oyerinde), GitHub handle (oyenet1), created date, and updated date.
2. WHEN the Framework generates any file, THE Header_Generator SHALL inject the header at the top of that file before any other content.
3. WHEN the Linter scans a file and finds no header comment, THE Linter SHALL report a violation identifying the file path and the missing header.
4. WHEN the developer runs `vono lint`, THE Linter SHALL scan all `.ts` and `.vue` files under `src/` and report all header violations.
5. WHEN the developer runs `vono fix:headers`, THE Header_Generator SHALL inject missing headers into all non-compliant files without modifying any other content in those files.

---

### Requirement 4: Standard API Response Format

**User Story:** As a developer, I want all API responses to follow a consistent payload structure, so that the frontend can reliably consume every endpoint.

#### Acceptance Criteria

1. THE Response_Formatter SHALL expose an `ApiResponse.success(data, message)` static method that returns a payload containing `success: true`, a `message` string, and a `data` field.
2. THE Response_Formatter SHALL expose an `ApiResponse.failure(message, errors?)` static method that returns a payload containing `success: false`, a `message` string, and an optional `errors` field.
3. THE Response_Formatter SHALL expose `success(message, data)` and `error(message, errors?)` convenience helper functions as aliases for the class methods.
4. WHEN a validation error occurs, THE Response_Formatter SHALL return an HTTP 422 status code with `success: false`, a `message` string, and an `errors` object mapping field names to error message strings.
5. WHEN an endpoint returns a collection, THE Response_Formatter SHALL include the collection array and a `meta` object containing `page`, `page_size`, `total_items`, `total_pages`, `has_next`, and `has_prev` via `buildPaginationMeta()`.
6. THE Linter SHALL report a violation for any route handler that returns a raw response object not produced by the Response_Formatter.

---

### Requirement 5: Database Schema Standards

**User Story:** As a developer, I want all database schemas to follow the Bonifade naming and structural conventions, so that the database layer is consistent and performant.

#### Acceptance Criteria

1. THE Framework SHALL enforce that all Drizzle ORM table names and column names use `snake_case`.
2. WHEN the Linter scans a Schema file, THE Linter SHALL report a violation for any table or column name that is not `snake_case`.
3. WHEN the Linter scans a Schema file, THE Linter SHALL report a violation if `created_at` or `updated_at` columns are absent from any table definition.
4. WHEN SaaS_Mode is enabled and the Linter scans a Schema file, THE Linter SHALL report a violation if a `deleted_at` nullable timestamp column is absent from any table definition.
5. WHEN the Linter scans a Schema file, THE Linter SHALL report a violation for any foreign key, status, email, or slug column that lacks a Drizzle ORM index definition.
6. WHEN the developer runs `vono migrate:make <name>`, THE CLI SHALL sync the `src/db/schema.ts` barrel file and invoke the Drizzle Kit migration generator, placing output in the configured migrations directory.
7. THE Framework SHALL provide `timestamps` and `softDeletable` Drizzle mixins in `src/db/mixins/` that can be spread into any table definition.

---

### Requirement 6: Soft Delete Helpers

**User Story:** As a developer building a SaaS product, I want a reusable soft delete utility, so that records are never permanently destroyed and queries automatically exclude deleted records.

#### Acceptance Criteria

1. THE Soft_Delete_Helper SHALL expose a `withSoftDeletes(table)` function that returns a Drizzle `isNull(table.deletedAt)` condition for use in `WHERE` clauses.
2. THE Soft_Delete_Helper SHALL expose an `onlyTrashed(table)` function that returns a Drizzle `isNotNull(table.deletedAt)` condition.
3. THE Soft_Delete_Helper SHALL expose a `withTrashed()` function that returns `undefined`, applying no `deleted_at` filter.
4. THE Soft_Delete_Helper SHALL expose a `restore(table, id)` function that sets `deleted_at` to `NULL` for the record with the given id.
5. WHEN SaaS_Mode is enabled, THE Framework SHALL generate all service files using `withSoftDeletes` as the default query wrapper.
6. FOR ALL valid query inputs, applying `withSoftDeletes` then `withTrashed` SHALL return the same result set as applying `withTrashed` alone (round-trip property).

---

### Requirement 7: API Versioning

**User Story:** As a developer, I want all APIs to be versioned from day one, so that future breaking changes can be introduced without affecting existing consumers.

#### Acceptance Criteria

1. WHEN the Framework scaffolds a new project, THE CLI SHALL mount all feature modules under `/api/v1/` by default via the inner API router.
2. WHEN the developer runs `vono make:version <version>`, THE CLI SHALL generate a new version namespace and register it in the app entry without modifying any existing version's files.
3. WHEN the Linter scans route files, THE Linter SHALL report a violation for any route that is not nested under a versioned prefix (e.g., `/api/v1/`).
4. WHILE a previous API version exists, THE Framework SHALL preserve all files belonging to that version unchanged when a new version is created.
5. IF a developer attempts to modify a route, controller, or schema file belonging to a previously released API version, THEN THE Linter SHALL emit a warning indicating that changes to released versions may introduce breaking changes.

---

### Requirement 8: Environment Variable Sync

**User Story:** As a developer, I want `.env` and `.env.example` to always stay in sync, so that onboarding new developers never fails due to missing environment variable documentation.

#### Acceptance Criteria

1. WHEN the developer runs `vono env:add <KEY> <description>`, THE CLI SHALL append the key with an empty placeholder value to both `.env` and `.env.example`, and add the description as an inline comment in `.env.example`.
2. WHEN the Linter runs, THE Linter SHALL compare all keys present in `.env` against `.env.example` and report any key that exists in `.env` but is absent from `.env.example`.
3. WHEN the Linter runs, THE Linter SHALL compare all keys present in `.env.example` against `.env` and report any key that exists in `.env.example` but is absent from `.env`.
4. IF the `.env` file does not exist in the project root, THEN THE CLI SHALL return an informational message and skip the sync check without throwing an error.

---

### Requirement 9: Logging Standards

**User Story:** As a developer, I want raw `console.log` calls banned from production code, so that all runtime output goes through a structured logger.

#### Acceptance Criteria

1. THE Framework SHALL generate a `Logger` utility in `src/shared/logger.ts` during project scaffolding, wrapping a structured logging library.
2. WHEN the Linter scans any `.ts` file under `src/`, THE Linter SHALL report a violation for every occurrence of `console.log`, `console.warn`, `console.error`, or `console.debug`.
3. WHEN the developer runs `vono fix:logs`, THE CLI SHALL replace detected raw `console.*` calls with the equivalent `Logger` method and add an import for the Logger if not already present.
4. IF a `console.*` call is found inside a file marked with `// @vono-ignore-logs`, THEN THE Linter SHALL skip that file without reporting a violation.

---

### Requirement 10: Middleware Scaffolding

**User Story:** As a developer, I want essential security and flow-control middleware pre-wired into every new project, so that I don't have to set up rate limiting, OTP, and error handling from scratch.

#### Acceptance Criteria

1. WHEN the Framework scaffolds a new project, THE CLI SHALL generate a rate-limiting middleware file in `src/shared/middleware/rateLimiter.ts` using a lazy-init pattern compatible with Cloudflare Workers.
2. WHEN the Framework scaffolds a new project, THE CLI SHALL generate an OTP verification middleware file in `src/shared/middleware/otpVerification.ts`.
3. WHEN the Framework scaffolds a new project, THE CLI SHALL generate a global error handler in the app entry that returns a `503 Service Unavailable` response for unhandled errors.
4. THE Response_Formatter SHALL be used inside all generated middleware files to produce error responses in the standard payload format.
5. WHEN the Linter scans the application entry point, THE Linter SHALL report a violation if the rate-limiting middleware is not registered.

---

### Requirement 11: Git & Version Control Automation

**User Story:** As a developer, I want the framework to enforce branching and commit conventions, so that the repository history stays clean and traceable.

#### Acceptance Criteria

1. WHEN the Framework scaffolds a new project, THE CLI SHALL initialize a Git repository and create an initial commit with the message `chore: initial project scaffold`.
2. WHEN the developer runs `vono branch:new <feature-name>`, THE CLI SHALL record the current branch as the parent branch, then create and check out a new branch named `feature/<feature-name>`.
3. WHEN the developer runs `vono branch:finish`, THE CLI SHALL merge the current feature branch into the recorded parent branch, delete the feature branch, and check out the parent branch.
4. IF the current branch has uncommitted changes when `vono branch:finish` is run, THEN THE CLI SHALL halt and return an error message instructing the developer to commit or stash changes first.
5. WHEN the developer runs `vono commit "<message>"`, THE CLI SHALL validate that the message conforms to the Conventional Commits format (e.g., `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`) and reject non-conforming messages with a descriptive error.

---

### Requirement 12: Testing Scaffold

**User Story:** As a developer, I want test files generated alongside every module, so that unit, integration, and end-to-end test coverage is set up from the start.

#### Acceptance Criteria

1. WHEN the developer runs `vono make:module <module-name>`, THE CLI SHALL generate a `tests/` folder containing `<module-name>.unit.test.ts`, `<module-name>.integration.test.ts`, and `<module-name>.e2e.test.ts`.
2. THE Framework SHALL configure `bun test` as the default test runner in `package.json` during project scaffolding, with Vitest and Jest available as alternatives via the wizard.
3. WHEN the developer runs `vono test`, THE CLI SHALL execute the configured test runner and report pass/fail results.
4. WHEN the developer runs `vono test:clean`, THE CLI SHALL delete all files matching `**/*.test.ts` after confirming all tests pass, and report an error without deleting if any test fails.
5. IF the test runner exits with a non-zero code during `vono test:clean`, THEN THE CLI SHALL halt the cleanup and display the failing test output.

---

### Requirement 13: Code Auditing

**User Story:** As a developer, I want the framework to audit generated and modified code automatically, so that standard violations are caught before they reach the repository.

#### Acceptance Criteria

1. WHEN the developer runs `vono audit`, THE Auditor SHALL scan all files under `src/` and produce a report listing all detected violations grouped by rule category.
2. THE Auditor report SHALL include for each violation: the file path, line number, rule name, and a human-readable description of the violation.
3. WHEN the Auditor detects zero violations, THE Auditor SHALL output a confirmation message and exit with code `0`.
4. WHEN the Auditor detects one or more violations, THE Auditor SHALL exit with code `1` so that CI/CD pipelines can fail the build.
5. WHEN the developer runs `vono audit --fix`, THE Auditor SHALL automatically resolve all auto-fixable violations (headers, log statements) and report which violations required manual intervention.

---

### Requirement 14: Naming Convention Enforcement

**User Story:** As a developer, I want the framework to enforce camelCase on API response fields and snake_case on database columns, so that the frontend and database layers are always correctly mapped.

#### Acceptance Criteria

1. WHEN the Linter scans a Schema file, THE Linter SHALL report a violation for any column name that is not `snake_case`.
2. WHEN the Linter scans a controller or service file, THE Linter SHALL report a violation for any object key returned in an API response that uses `snake_case` instead of `camelCase`.
3. WHEN the Framework generates a service file, THE Framework SHALL include a mapping step that converts `snake_case` database fields to `camelCase` before returning data to the controller.
4. THE Framework SHALL provide a shared `toCamel(obj)` utility in `src/shared/utils/mappers.ts` that recursively converts all `snake_case` keys in an object to `camelCase`.
5. FOR ALL valid plain objects, applying `toCamel` twice SHALL produce the same result as applying it once (idempotence property).

---

### Requirement 15: DRY Principle Enforcement

**User Story:** As a developer, I want the framework to detect duplicated logic across modules, so that shared utilities are extracted and reused rather than copied.

#### Acceptance Criteria

1. WHEN the Linter detects an identical function body appearing in more than two files under `src/modules/`, THE Linter SHALL report a DRY violation identifying all file paths where the duplication occurs.
2. WHEN the developer runs `vono make:helper <helper-name>`, THE CLI SHALL generate a shared helper file in `src/shared/utils/<helper-name>.ts` with the standard header and an exported function stub.
3. THE Framework SHALL provide a `src/shared/` directory in every scaffolded project, pre-populated with `response.ts` (Response_Formatter), `logger.ts` (Logger), `mappers.ts` (toCamel), `softDeletes.ts` (Soft_Delete_Helper), `pagination.ts` (Paginator), `id.ts` (generateId, prefixedId), and `autoRoutes.ts` (autoRegisterRoutes).

---

### Requirement 16: Package Architecture & npm Packages

**User Story:** As a developer, I want Vono to ship as clearly separated npm packages, so that I can install only what my project needs.

#### Acceptance Criteria

1. THE Framework SHALL publish `create-vono` as the interactive project scaffolder installable via `bun create vono@latest <app-name>`.
2. THE Framework SHALL publish `vono` as the core runtime package with subpath exports: `vono` (config/composables), `vono/vite` (Vite plugin), `vono/server` (server helpers), `vono/client` (client composables), and `vono/types` (shared TypeScript types).
3. THE Framework SHALL publish `@vono/cli` as the Artisan-style scaffolding CLI installed as a dev dependency.
4. THE Framework SHALL publish `@vono/drizzle` as the Drizzle ORM integration package providing mixins, soft deletes, scopes, and seed helpers.
5. THE Framework SHALL publish `@vono/auth`, `@vono/notifications`, `@vono/logging`, and `@vono/ws` as optional add-on modules installable via `vono add <module>`.
6. WHEN the developer runs `vono add <module>`, THE CLI SHALL install the package, generate required files, and update `vono.config.ts` — and the operation SHALL be idempotent (running it again skips existing files). Supported `vono add` commands include: `vono add auth`, `vono add storage` (prompts for driver), `vono add queue`, `vono add cache`, `vono add email`, `vono add oauth google`, `vono add oauth github`, `vono add websocket`, `vono add notifications`, `vono add logging`, `vono add ws`, and `vono add i18n`.
7. WHEN the developer runs `vono add <module> --eject`, THE CLI SHALL copy the module's source into `src/modules/<module>/`, remove the package dependency, and update `vono.config.ts`.
8. THE `create-vono` package SHALL use `@clack/prompts` for terminal prompts, `giget` for template fetching, `kolorist` for terminal colors, and `execa` for running install commands.

---

### Requirement 17: Vue Frontend Integration & File-Based Routing

**User Story:** As a developer, I want Vue 3 pages to be auto-discovered from module folders, so that I never have to manually register routes.

#### Acceptance Criteria

1. THE Framework SHALL configure the `VueRouter` Vite plugin to scan `src/modules/` for `*.page.vue` files and auto-generate routes, where the module folder name becomes the URL prefix.
2. THE Framework SHALL support dynamic route params via filename conventions: `[id].page.vue` → `/:id`, `[[id]].page.vue` → `/:id?`, `[...slug].page.vue` → `/:slug(.*)`.
3. THE Framework SHALL support route grouping via `(group)/` folder names that add no URL segment.
4. WHEN a page uses the `definePage()` compiler macro, THE Vue_Router plugin SHALL apply the declared `meta` (title, layout, middleware) to that route without requiring changes to a central router file.
5. THE Framework SHALL provide a `<ClientOnly>` component that renders its slot only after client-side mount, with a `#fallback` slot for server-side placeholder content.
6. THE Framework SHALL provide shared composables `useSeo()`, `useRouteRules()`, and `useFormErrors()` in `src/shared/composables/`.
7. THE Framework SHALL use Nuxt UI v4 as the default frontend component library, pre-configured with Tailwind CSS via `@import "tailwindcss"; @import "@nuxt/ui";` in `src/assets/css/main.css`.
8. THE Framework SHALL use Pinia for state management with SSR hydration support, wrapping the app with `createPinia()` in the shared app factory.
9. THE generated `src/App.vue` SHALL wrap `<RouterView />` in `<UApp>` from Nuxt UI.

---

### Requirement 18: Hybrid SSR/SPA Rendering (Route Rules)

**User Story:** As a developer, I want to configure per-route rendering modes, so that public pages get full SSR for SEO while authenticated app pages use lightweight SPA mode.

#### Acceptance Criteria

1. THE Framework SHALL provide a `src/route-rules.ts` file with a `routeRules` config object mapping URL patterns to `RouteRule` objects containing `mode` (`ssr` | `spa` | `prerender`), optional `cache` (seconds), and optional `swr` (boolean).
2. THE Framework SHALL provide a `resolveRouteRule(path)` utility that matches a URL path against `routeRules` top-to-bottom (first match wins) and returns the matching rule, supporting exact matches and `/**` wildcard suffixes.
3. WHEN a route resolves to `ssr` mode, THE Server SHALL render the Vue app to HTML via `renderToString`, inject head tags, Pinia state, and return the full HTML response with appropriate `Cache-Control` headers.
4. WHEN a route resolves to `spa` mode, THE Server SHALL return a bare HTML shell without server-rendering the Vue app and SHALL set an `X-Robots-Tag: noindex, nofollow` response header.
5. WHEN a route resolves to `ssr` mode with `cache` and `swr` set, THE Server SHALL set a `Cache-Control: public, max-age=<cache>, stale-while-revalidate=<cache*2>` header.
6. FOR ALL valid URL paths, `resolveRouteRule(path)` SHALL return the `defaultRule` when no pattern matches (metamorphic property).

---

### Requirement 19: Streaming SSR

**User Story:** As a developer, I want SSR pages to stream HTML in chunks, so that Time to First Byte is minimized for large pages.

#### Acceptance Criteria

1. THE Framework SHALL provide a `renderStream(url)` function that uses `renderToWebStream` from `vue/server-renderer` to produce a `ReadableStream` of HTML chunks.
2. WHEN a route resolves to `ssr` mode, THE Server SHALL use Hono's `stream()` helper to write the `<head>` section immediately, then pipe the Vue stream chunks, then close the document.
3. WHEN a route resolves to `spa` mode, THE Server SHALL fall back to the non-streaming path and return the bare HTML shell directly.
4. THE Framework SHALL support streaming on all runtimes that support `ReadableStream` (Node.js, Bun, Cloudflare Workers, Deno).

---

### Requirement 20: SEO Layer

**User Story:** As a developer, I want every SSR page to have complete SEO metadata server-rendered into the initial HTML, so that search engines and social platforms receive full meta tags.

#### Acceptance Criteria

1. THE Framework SHALL provide a `useSeo(options)` composable that sets `<title>`, `<meta name="description">`, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`), Twitter Card tags, and `<link rel="canonical">` via `@unhead/vue`.
2. WHEN `structuredData` is passed to `useSeo()`, THE Framework SHALL inject a `<script type="application/ld+json">` tag with the serialized JSON-LD object.
3. WHEN `noIndex: true` is passed to `useSeo()`, THE Framework SHALL add `<meta name="robots" content="noindex, nofollow">` to the page head.
4. THE Framework SHALL expose a `GET /robots.txt` endpoint that dynamically generates a robots.txt blocking `/dashboard`, `/admin`, `/settings`, and `/api`, and referencing the sitemap URL.
5. THE Framework SHALL expose a `GET /sitemap.xml` endpoint that generates a valid XML sitemap for all SSR-mode public pages.
6. WHEN serving hashed static assets in production, THE Server SHALL set `Cache-Control: public, max-age=31536000, immutable` headers.

---

### Requirement 21: Pinia SSR State Hydration

**User Story:** As a developer, I want Pinia state fetched during SSR to be available on the client without a second fetch, so that there is no content flash or duplicate network request.

#### Acceptance Criteria

1. WHEN rendering in SSR mode, THE Server SHALL serialize `pinia.state.value` to JSON and inject it as `<script id="__pinia" type="application/json">` in the HTML response, with `<` and `>` characters escaped to prevent XSS.
2. WHEN the client hydrates, THE Client SHALL read the `#__pinia` script element, parse the JSON, and set `pinia.state.value` before mounting the Vue app.
3. THE Framework SHALL support `onServerPrefetch()` in page components for server-side data fetching that runs before `renderToString` completes.
4. FOR ALL valid Pinia state objects, serializing on the server then deserializing on the client SHALL produce an equivalent state object (round-trip property).

---

### Requirement 22: Vite Plugin & Build System

**User Story:** As a developer, I want a single Vite plugin entry point that configures the entire framework, so that I don't have to manually wire SSR, routing, auto-imports, and the dev server.

#### Acceptance Criteria

1. THE Vite_Plugin SHALL be importable from `vono/vite` and usable as `plugins: [vono()]` in `vite.config.ts`, internally composing `@vitejs/plugin-vue`, `vue-router/vite`, `unplugin-auto-import/vite`, `unplugin-vue-components/vite`, `@hono/vite-dev-server`, and `@nuxt/ui/vite`.
2. WHEN the developer runs the build command, THE Vite_Plugin SHALL perform a dual build: a client build to `dist/client/` and an SSR build to `dist/server/`.
3. THE Vite_Plugin SHALL configure `@hono/vite-dev-server` for development, excluding Vue files, static assets, and CSS from the Hono handler so Vite handles them directly.
4. WHEN `vono.config.ts` changes during development, THE Vite_Plugin SHALL trigger a full dev server restart.
5. WHEN API route files change during development, THE Vite_Plugin SHALL hot-reload them via `ssrLoadModule` without a full restart.
6. THE Vite_Plugin SHALL resolve the `@@ws-adapter` alias to the correct WebSocket adapter import based on the configured deployment target.
7. THE Vite_Plugin SHALL generate `src/auto-imports.d.ts`, `src/auto-imports-client.d.ts`, and `src/components.d.ts` type declaration files for all auto-imported symbols.

---

### Requirement 23: Two-Layer Hono App Architecture

**User Story:** As a developer, I want the Hono server to separate cross-cutting concerns from feature modules, so that CORS, logging, and docs endpoints never have unnecessary database access.

#### Acceptance Criteria

1. THE Framework SHALL generate an outer Hono app that applies `hono/logger`, `hono/pretty-json`, and `hono/cors` middleware globally, and exposes a health check at `GET /` returning `name`, `version`, `status`, and `docs` URL.
2. THE Framework SHALL generate an inner API router that applies `configProvider` and `dbProvider` middleware once, then auto-mounts all feature modules via `autoRegisterRoutes()`.
3. THE configProvider middleware SHALL read env vars from `c.env` (Cloudflare Workers) or `process.env` (Node/Bun), validate required vars, and set `c.var.config`.
4. THE dbProvider middleware SHALL create a Drizzle client, set `c.var.db`, call `await next()`, and close the connection in a `finally` block.
5. THE autoRegisterRoutes utility SHALL use `import.meta.glob` to discover all `*.routes.ts` files under `src/modules/`, extract the module name from the path, and mount each module's default export at `/{moduleName}`.
6. THE Framework SHALL mount the inner API router at `/api/v1` on the outer app.
7. THE outer app SHALL expose `GET /openapi.json`, `GET /docs` (Swagger UI), and `GET /fp` (Fiberplane playground) endpoints.
8. THE Framework SHALL generate a `src/modules/health/health.routes.ts` module that exposes `GET /health` returning `{ status: 'ok', timestamp: Date.now() }`, auto-registered via `autoRegisterRoutes()`.

---

### Requirement 24: OpenAPI & API Documentation

**User Story:** As a developer, I want auto-generated API documentation available in the browser, so that I and my team can explore and test endpoints without external tools.

#### Acceptance Criteria

1. THE Framework SHALL generate an `src/openapi.ts` file containing an OpenAPI 3.1 spec object with `info`, `servers`, `tags`, `components.securitySchemes` (bearerAuth), and `components.schemas`.
2. THE Framework SHALL mount Swagger UI at `GET /docs` via `@hono/swagger-ui`, pointing to `GET /openapi.json`.
3. THE Framework SHALL mount Scalar API Reference at `GET /reference` via `@scalar/hono-api-reference` as a supported alternative to Swagger UI, pointing to `GET /openapi.json`.
4. THE Framework SHALL mount the Fiberplane API playground at `GET /fp/*` via `@fiberplane/hono`, pointing to `GET /openapi.json`.
5. WHEN the developer runs `vono make:module`, THE CLI SHALL add a tag entry for the new module to `src/openapi.ts`.

---

### Requirement 25: CORS Configuration

**User Story:** As a developer, I want CORS to be configured from `vono.config.ts`, so that allowed origins are managed in one place and support both Cloudflare Workers and Node.js environments.

#### Acceptance Criteria

1. THE Framework SHALL configure `hono/cors` middleware on the outer app using the `cors` settings from `vono.config.ts`.
2. THE CORS origin validator SHALL read allowed origins from the `ALLOWED_ORIGINS` environment variable (comma-separated), checking `c.env` first then `process.env`.
3. THE Framework SHALL default to allowing `Content-Type`, `Authorization`, and `X-API-Key` headers, and `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` methods with `credentials: true`.
4. WHEN `NODE_ENV` is `development`, THE Framework SHALL automatically allow `http://localhost:4000` and `http://localhost:5173` as origins.

---

### Requirement 26: Authentication System (`@vono/auth`)

**User Story:** As a developer, I want a complete authentication system scaffolded with a single command, so that I have working login, registration, OAuth, and session management without writing boilerplate.

#### Acceptance Criteria

1. WHEN the developer runs `vono add auth`, THE CLI SHALL scaffold auth API routes, controller, service, DTO, schema, frontend pages (login, register, forgot-password, reset-password), and a `useAuth` composable.
2. THE Framework SHALL implement JWT access tokens (15-minute expiry) and refresh tokens (7-day expiry) using `hono/jwt` with PBKDF2 password hashing via the Web Crypto API (compatible with Cloudflare Workers).
3. THE Framework SHALL provide `authMiddleware` that verifies the JWT, loads the user's roles from the database, and sets `c.var.account` as an `AuthAccount` object.
4. THE Framework SHALL provide `isAdmin` and `isSuperAdmin` role guard middleware that throw HTTP 403 if the authenticated user lacks the required role.
5. THE Framework SHALL provide `apiKeyOrJwtMiddleware` that accepts either a JWT Bearer token or an API key with the `vono_*` prefix from the `X-API-Key` header or `Authorization: Bearer vono_*` header.
6. WHEN OAuth is enabled, THE Framework SHALL implement Google and GitHub OAuth flows: a redirect endpoint that builds the OAuth URL and a callback endpoint that exchanges the code, finds or creates the account, and redirects to the frontend with tokens.
7. WHEN magic link is enabled, THE Framework SHALL generate a signed token, email it to the user, and verify it on the callback endpoint to authenticate the user.
8. THE Framework SHALL store refresh tokens as SHA-256 hashes in an `auth_session` table and provide endpoints to list sessions, revoke a session, and revoke all sessions except the current one.
9. THE Framework SHALL implement OTP-based password reset: generate a 6-digit OTP, store it in a `verification_code` table, email it via the configured provider, and verify it before allowing a password reset.
10. THE Framework SHALL define a `ROLES` const array (`user`, `admin`, `superadmin`, `staff`, `customer_care`) and a `Role` type derived from it.
11. THE Framework SHALL provide an `optionalAuthMiddleware` that attempts JWT verification but silently continues as a guest (unauthenticated) if no token is present or the token is invalid, without throwing an HTTP error.
12. THE Framework SHALL document and scaffold 5 route auth patterns: all-auth (all routes require authentication), public-then-auth (public routes before auth middleware, protected routes after), webhook-before-auth (HMAC-verified webhook routes mounted before auth), optional-auth (routes accessible by both guests and authenticated users via `optionalAuthMiddleware`), and admin-namespace (routes under an `/admin` prefix guarded by `isAdmin` middleware).

---

### Requirement 27: Type System

**User Story:** As a developer, I want fully typed Hono context variables, so that I get autocomplete on `c.var.config`, `c.var.db`, and `c.var.account` throughout the codebase.

#### Acceptance Criteria

1. THE Framework SHALL define an `AuthAccount` interface with fields: `id`, `email`, `username`, `currentRole`, `roles`, `status`, and `language`.
2. THE Framework SHALL define an `Env` interface listing all Cloudflare Worker bindings (HYPERDRIVE, DATABASE_URL, JWT_SECRET, OAuth keys, RESEND_API_KEY, payment keys, etc.).
3. THE Framework SHALL define a `Config` interface with the same keys as `Env` but guaranteed non-undefined (validated by `configProvider`).
4. THE Framework SHALL define an `AppVariables` interface with `config: Config`, `db: DrizzleDb`, `account: AuthAccount`, and an index signature for module-level custom vars.
5. EVERY generated Hono sub-app SHALL be typed as `new Hono<{ Variables: AppVariables; Bindings: Env }>()`.

---

### Requirement 28: Zod Validation Middleware

**User Story:** As a developer, I want a consistent Zod validation wrapper that always returns 422 errors in the standard format, so that the frontend can map errors directly to form fields.

#### Acceptance Criteria

1. THE Framework SHALL provide a `zodValidator(target, schema)` middleware factory in `src/shared/middleware/validator.ts` that wraps `@hono/zod-validator` and returns `{ success: false, message: "Validation failed", errors: { field: message } }` with HTTP 422 on failure.
2. THE Framework SHALL provide a shared `QuerySchema` Zod schema in `src/shared/dto/query.dto.ts` with `page`, `limit`, `q`, `sortBy`, `sortOrder`, `category`, and `fields` fields for reuse across all list endpoints.
3. WHEN a validation error occurs, THE zodValidator SHALL collect all Zod issues and map each `issue.path.join(".")` to `issue.message` in the `errors` object.
4. THE Frontend SHALL use Zod to validate API error responses and map `errors` fields directly underneath the corresponding form inputs.

---

### Requirement 29: Database Connection Pooling

**User Story:** As a developer, I want database connections to be pooled appropriately for my deployment target, so that the app performs well under load without exhausting database connections.

#### Acceptance Criteria

1. WHEN the deployment target is Node.js or Bun, THE Framework SHALL use a shared connection pool (min 2, max 20 connections) attached once at startup, with `dbProvider` setting `c.var.db` to the shared pool instance.
2. WHEN the deployment target is Cloudflare Workers, THE Framework SHALL use Hyperdrive for connection pooling, creating a single Drizzle client per request from `c.env.HYPERDRIVE.connectionString` and closing it in `finally`.
3. WHEN the deployment target is Vercel or Deno Deploy, THE Framework SHALL use an HTTP-based serverless driver (Neon serverless or `@vercel/postgres`) that does not require persistent TCP connections.
4. THE Framework SHALL provide a `createDb(connectionString)` factory function in `src/db/index.ts` that returns a `{ db, client }` pair.
5. FOR ALL deployment targets, THE dbProvider middleware SHALL ensure the database connection is closed or released after every request, even if the handler throws an error.

---

### Requirement 30: Database Transactions

**User Story:** As a developer, I want to wrap multiple database operations in a transaction, so that partial failures are automatically rolled back.

#### Acceptance Criteria

1. THE Framework SHALL support Drizzle ORM's native `db.transaction(async (tx) => { ... })` API for wrapping multiple operations in an atomic transaction.
2. WHEN `tx.rollback()` is called inside a transaction, THE Framework SHALL roll back all operations performed within that transaction.
3. WHEN a service method accepts a `dbOrTx` parameter typed as `DrizzleDB | DrizzleTransaction`, THE method SHALL work correctly with both a regular database instance and a transaction context.

---

### Requirement 31: Deployment Targets

**User Story:** As a developer, I want to deploy my Vono app to any supported runtime without code changes, so that I can choose the best infrastructure for my needs.

#### Acceptance Criteria

1. THE Framework SHALL support deployment to Node.js via `@hono/node-server`, Bun (zero changes), Deno, Docker (with auto-generated Dockerfile), Cloudflare Workers (using `renderToWebStream`, no `fs`), and Vercel (serverless function). The default application port is `4000` (configurable via `process.env.PORT`).
2. WHEN the deployment target is Bun or Node.js, THE Framework SHALL auto-generate a `ecosystem.config.js` PM2 config: Bun uses `exec_mode: 'fork'` with `interpreter: 'bun'`; Node.js uses `exec_mode: 'cluster'` with `instances: 'max'`.
3. WHEN the deployment target is Docker (Bun) or Docker (Node), THE Framework SHALL auto-generate a multi-stage `Dockerfile` that uses `pm2-runtime ecosystem.config.js` as the container entrypoint and `EXPOSE 4000`.
4. WHEN the deployment target is Docker and a Redis-backed queue driver is selected, THE CLI SHALL generate a `docker-compose.yml` with `app` and `redis` services, and a `wait-for-redis.sh` entrypoint script.
5. WHEN the deployment target is Cloudflare Workers, THE Framework SHALL generate a `wrangler.jsonc` configuration file and use `renderToWebStream` instead of `renderToString`.
6. WHEN the deployment target is Cloudflare Workers, THE CLI SHALL generate a `set-secrets.sh` script that uses `wrangler secret put` to upload all required env vars as Cloudflare Worker secrets.
7. THE generated server entry SHALL handle `SIGINT` for graceful shutdown, closing database connections before exiting.

---

### Requirement 32: WebSocket & Real-Time (`@vono/ws`)

**User Story:** As a developer, I want to add real-time WebSocket support to my app with a single command, so that I can build live features without configuring a separate WebSocket server.

#### Acceptance Criteria

1. WHEN the developer runs `vono add ws`, THE CLI SHALL prompt for the WebSocket driver (Hono built-in or Socket.IO) and install the appropriate packages and generate server + client code.
2. THE Framework SHALL support Hono's `upgradeWebSocket()` helper on all runtimes (Bun via `hono/bun`, Node via `@hono/node-ws`, Cloudflare Workers via `hono/cloudflare-workers`, Deno via `hono/deno`), with the correct import resolved automatically via the `@@ws-adapter` alias.
3. THE Framework SHALL support Socket.IO (with `@socket.io/bun-engine` for Bun, `socket.io` for Node) only when the deployment target is Bun, Node.js, Docker (Bun), or Docker (Node).
4. THE Framework SHALL generate a `useWebSocket(path)` Vue composable in `src/shared/composables/useWebSocket.ts` that provides reactive `messages`, `isConnected`, `send()`, `connect()`, and `disconnect()` with auto-reconnect on close.
5. WHEN the deployment target is a serverless or edge runtime (Vercel, Netlify, Lambda, Fastly), THE CLI SHALL warn that Socket.IO is not supported and fall back to Hono WebSocket.

---

### Requirement 33: Notifications Module (`@vono/notifications`)

**User Story:** As a developer, I want an in-app notification system scaffolded automatically, so that I can notify users of events without building the schema, API, and UI from scratch.

#### Acceptance Criteria

1. WHEN the developer runs `vono add notifications`, THE CLI SHALL generate Drizzle `notifications` and `notification_preferences` table schemas, a notification service, controller, routes, and (in full-stack mode) a notifications page.
2. THE notifications API SHALL provide endpoints to list notifications for the authenticated user, mark a notification as read, mark all as read, and delete a notification.
3. THE notifications API SHALL provide endpoints to get and update notification preferences per user.
4. WHEN a notification is created, THE Framework SHALL support dispatching it via the queue (if configured) for async persistence, falling back to synchronous DB write.

---

### Requirement 34: Activity Logging Module (`@vono/logging`)

**User Story:** As a developer, I want an activity and audit trail system, so that I can track what actions users perform in the application.

#### Acceptance Criteria

1. WHEN the developer runs `vono add logging`, THE CLI SHALL generate a Drizzle `activity_logs` table schema, a logging service, and a queue job for async log persistence.
2. WHEN a queue driver is configured, THE logging service SHALL dispatch log events to the queue for async DB writes; otherwise it SHALL write synchronously.
3. THE activity log record SHALL capture: actor ID, action name, resource type, resource ID, IP address, user agent (parsed via `src/lib/ua-parser.ts`), and timestamp.
4. THE Framework SHALL provide an admin API endpoint to query activity logs with filtering by actor, action, resource type, and date range.

---

### Requirement 35: Vono Config System

**User Story:** As a developer, I want a typed, runtime-aware configuration system, so that I can define all framework settings in one place and access them safely on both server and client.

#### Acceptance Criteria

1. THE Framework SHALL provide a `defineVonoConfig(config)` function exported from `vono` that accepts and validates the full framework configuration object.
2. THE Framework SHALL provide a `useVonoConfig()` composable that returns the resolved config, stripping server-only values when called on the client.
3. THE Vite_Plugin SHALL read `vono.config.ts` at build time and inject a `virtual:vono/config` module with the resolved public config values.
4. WHEN `vono.config.ts` is missing or contains invalid configuration, THE Framework SHALL throw a descriptive error at startup before accepting any requests.
5. THE `defineVonoConfig()` function SHALL accept a `ui.colors` object with `primary` and `neutral` color keys that configure the Nuxt UI theme, passed to the `@nuxt/ui/vite` plugin.

---

### Requirement 36: Module/Plugin System

**User Story:** As a developer, I want to create installable Vono modules that register middleware, schemas, routes, and pages, so that I can package and share framework extensions.

#### Acceptance Criteria

1. THE Framework SHALL provide a `defineVonoModule(definition)` function that accepts `name`, `version`, `requires`, `middleware`, `schemas`, `serverImports`, `clientImports`, `pages`, `components`, `routes`, `migrations`, `configSchema`, `setup`, and `hooks` fields.
2. WHEN a module is registered in `vono.config.ts` via the `modules` array, THE Vite_Plugin SHALL merge the module's schemas into `src/db/schema.ts`, mount its routes, register its auto-imports, and add its pages to the file-based router.
3. THE Framework SHALL support module lifecycle hooks: `app:created`, `app:ready`, `build:before`, `build:after`, and `routes:resolved`.
4. WHEN the developer runs `vono add <module> --eject`, THE CLI SHALL copy the module source into `src/modules/<module>/`, remove the package from dependencies, and update `vono.config.ts`.

---

### Requirement 37: Vono Client Composables

**User Story:** As a developer, I want SSR-safe composables for data fetching, cookies, shared state, and navigation, so that I can build full-stack features without worrying about server/client differences.

#### Acceptance Criteria

1. THE Framework SHALL provide `useAsyncData(key, fetcher, options?)` that fetches on the server during SSR, stores the result in the SSR payload, and hydrates on the client without a duplicate fetch.
2. THE Framework SHALL provide `useVonoFetch(url, options?)` as a typed fetch wrapper that uses relative URLs on the server and absolute URLs on the client, automatically forwarding auth cookies during SSR.
3. THE Framework SHALL provide `useCookie(name, options?)` that reads from request headers on the server and `document.cookie` on the client, and supports writing (sets cookie on both server response and client).
4. THE Framework SHALL provide `useState(key, init?)` that stores shared state in the SSR payload, serializes it as `window.__VONO_STATE__` in the HTML, and restores it during client hydration.
5. THE Framework SHALL provide `navigateTo(path, options?)` that wraps `vue-router` for programmatic navigation, supporting `replace`, `external`, and `redirectCode` options, and sending a 302 redirect during SSR.
6. FOR ALL valid state values, serializing via `useState` on the server then deserializing on the client SHALL produce an equivalent value (round-trip property).

---

### Requirement 38: Gates & Policies (Authorization)

**User Story:** As a developer, I want a gate and policy system for authorization, so that I can define per-resource access rules without scattering permission checks throughout controllers.

#### Acceptance Criteria

1. THE Framework SHALL provide an `authorize(user, ability, resource?)` function that throws HTTP 403 if the user is not permitted, and a `can(user, ability, resource?)` function that returns a boolean.
2. THE Framework SHALL support Gate-based authorization (no resource) registered in `src/shared/gates/index.ts` and Policy-based authorization (per resource) defined in `src/<module>/<module>.policy.ts`.
3. WHEN the developer runs `vono make:policy <name>`, THE CLI SHALL generate a policy file in `src/modules/<name>/<name>.policy.ts` with stubs for `view`, `create`, `update`, `delete`, and `forceDelete` actions, and register it in `src/shared/policies/index.ts`.
4. THE Framework SHALL provide a `gate(ability)` middleware factory and a `policy(ability)` middleware factory for use directly in route definitions.

---

### Requirement 39: Resources — API Response Transformers

**User Story:** As a developer, I want resource classes to transform database rows into clean API shapes, so that I can rename fields, compute values, and hide internals without touching the service layer.

#### Acceptance Criteria

1. THE Framework SHALL support Resource classes with `static toResource(item)` and `static toCollection(items, total, page, limit)` methods that transform raw DB rows into shaped API responses.
2. WHEN the developer runs `vono make:resource <name>`, THE CLI SHALL generate a resource file in `src/modules/<name>/<name>.resource.ts` with both methods pre-stubbed.
3. THE `toCollection` method SHALL use `buildPaginationMeta()` to include a `meta` pagination object with `page`, `page_size`, `total_items`, `total_pages`, `has_next`, and `has_prev` fields alongside the `items` array.
4. THE `toResource` method SHALL accept an optional `fields` string array and return only the requested keys when provided (field selection).
5. THE Framework SHALL provide a `resolveStorageUrl(path, config?)` utility in `src/shared/utils/storage.ts` that converts stored file paths to full public URLs based on the configured storage driver.

---

### Requirement 40: Environment Validation

**User Story:** As a developer, I want all environment variables validated at startup using Zod, so that the app fails fast with a clear error message if required config is missing.

#### Acceptance Criteria

1. THE Framework SHALL validate all environment variables defined in `vono.config.ts` `env.schema` using Zod at application startup, before accepting any requests.
2. WHEN validation fails, THE Framework SHALL print a formatted error listing each failing variable with its Zod error message and exit the process.
3. THE Framework SHALL support cross-field validation via an `env.refine` function that can throw errors for dependent variable combinations (e.g., requiring `GOOGLE_CLIENT_SECRET` when `GOOGLE_CLIENT_ID` is set).
4. WHEN the developer runs `vono add <module>`, THE CLI SHALL append the module's required env vars to `.env.example` with descriptive comments.
5. THE Framework SHALL provide a `defineEnv(schema)` helper that wraps Zod env validation and returns a typed, validated config object.

---

### Requirement 41: File Uploads & Storage

**User Story:** As a developer, I want a storage abstraction layer, so that I can switch between local disk, S3, R2, Cloudinary, and Bunny.net without changing upload handler code.

#### Acceptance Criteria

1. THE Framework SHALL provide a `useStorage(c)` server helper that returns a storage client for the configured driver, with `upload(file, options?)`, `delete(key)`, and `url(key)` methods.
2. THE Framework SHALL support storage drivers: `local` (saves to `./storage/uploads`, serves at `/uploads`), `r2` (Cloudflare R2 via S3-compatible API), `s3` (AWS S3), `cloudinary` (image/video CDN), and `bunny` (Bunny.net CDN via REST API).
3. WHEN the developer runs `vono add storage`, THE CLI SHALL prompt for the driver and install the required package (`cloudinary`, `@aws-sdk/client-s3`, etc.).
4. WHEN a file upload exceeds the configured maximum size, THE upload handler SHALL return HTTP 413 with a standard error response.
5. WHEN a file upload has a disallowed MIME type, THE upload handler SHALL return HTTP 415 with a standard error response.

---

### Requirement 42: Cron / Scheduled Jobs

**User Story:** As a developer, I want to define scheduled jobs using a cron syntax, so that recurring tasks run automatically without a separate job scheduler service.

#### Acceptance Criteria

1. THE Framework SHALL provide a `defineJob({ name, schedule, description, handler })` function where `handler` receives `{ db, config, logger }` and `schedule` is a standard cron expression.
2. WHEN the deployment target is Node.js or Bun, THE Framework SHALL use `node-cron` to run jobs in-process on the configured schedule.
3. WHEN the deployment target is Cloudflare Workers, THE Framework SHALL generate a `[triggers]` section in `wrangler.jsonc` for each defined cron job.
4. WHEN the deployment target is Vercel, THE Framework SHALL generate a `vercel.json` `crons` config entry for each defined cron job.
5. WHEN the developer runs `vono make:job <name> --module=<module> --schedule="<cron>"`, THE CLI SHALL generate a job file in `src/modules/<module>/jobs/<name>.job.ts`.
6. WHEN the developer runs `vono jobs:run <name>`, THE CLI SHALL execute the named job immediately outside of its schedule.

---

### Requirement 43: Email Templates

**User Story:** As a developer, I want a typed email template system, so that I can define HTML emails as TypeScript functions and send them via any configured provider.

#### Acceptance Criteria

1. THE Framework SHALL provide a `defineEmail({ subject, html, text })` function where `subject`, `html`, and `text` are functions that accept a typed data object and return strings.
2. THE Framework SHALL provide a `sendEmail(c, { to, subject, html, text, queue? })` server helper that sends via the configured email driver (`resend`, `postmark`, `smtp`, or `console`).
3. WHEN `queue: true` is passed to `sendEmail`, THE Framework SHALL dispatch the email to the queue for async delivery instead of sending immediately.
4. WHEN the developer runs `vono make:email <name> --module=<module>`, THE CLI SHALL generate an email template file in `src/modules/<module>/emails/<name>.email.ts`.
5. THE Framework SHALL support email providers: Resend (`resend` package), Postmark (`postmark` package), SMTP (`nodemailer`), and Console (dev-only, logs to stdout).
6. FOR ALL valid email template data objects, calling `WelcomeEmail.render(data)` SHALL produce a `{ subject, html, text }` object where `html` contains the data values (round-trip property).

---

### Requirement 44: i18n / Localization

**User Story:** As a developer, I want optional internationalization support, so that I can serve content in multiple languages without restructuring my application.

#### Acceptance Criteria

1. THE Framework SHALL provide an `@vono/i18n` module installable via `vono add i18n` that supports `prefix`, `cookie`, and `header` locale detection strategies.
2. WHEN i18n is configured, THE Framework SHALL load translation files from `src/locales/<locale>.json` on demand (lazy loading).
3. THE Framework SHALL provide a `useI18n()` composable returning `t(key)`, `locale`, `setLocale(locale)`, and `availableLocales`.
4. THE Framework SHALL provide a server-side `getLocale(c)` and `t(locale, key)` for translating API responses.
5. THE `AuthAccount` interface SHALL include a `language` field that stores the user's preferred locale.

---

### Requirement 45: Layout System

**User Story:** As a developer, I want a layout system for Vue pages, so that I can define shared page shells (navbar, sidebar, footer) and assign them to pages without repeating markup.

#### Acceptance Criteria

1. THE Framework SHALL auto-discover layout components from `src/shared/layouts/` and make them available to pages via the `layout` field in `definePage()` meta.
2. THE Framework SHALL scaffold `default.vue`, `dashboard.vue`, and `auth.vue` layouts during project creation.
3. WHEN a page sets `layout: 'auth'` in `definePage()`, THE Framework SHALL wrap that page's content with `src/shared/layouts/auth.vue` instead of the default layout.
4. WHEN a page sets `layout: 'blank'` or no layout is specified and no default exists, THE Framework SHALL render the page without any layout wrapper.
5. THE Framework SHALL provide a `resolveLayout(layoutName)` utility from `vono/client` that returns the correct layout component for use in `App.vue`.

---

### Requirement 46: Auto-Imports

**User Story:** As a developer, I want shared utilities, composables, and framework APIs to be available without explicit import statements, so that module files stay concise and focused on business logic.

#### Acceptance Criteria

1. THE Framework SHALL configure `unplugin-auto-import` to auto-import server-side utilities from `src/shared/utils/**`, `src/shared/middleware/**`, `src/shared/dto/**`, and `src/lib/**`.
2. THE Framework SHALL configure `unplugin-auto-import` to auto-import Hono (`Hono`, `HTTPException`), Drizzle ORM operators (`eq`, `and`, `or`, `desc`, `asc`, `isNull`, `isNotNull`, `sql`, `count`, `like`, `inArray`), and Zod (`z`) on the server side.
3. THE Framework SHALL configure `unplugin-auto-import` to auto-import Vue (`ref`, `computed`, `watch`, `onMounted`, etc.), Vue Router (`useRoute`, `useRouter`), and Pinia (`defineStore`, `storeToRefs`) on the client side, including in `<template>` blocks.
4. THE Framework SHALL allow developers to extend auto-imports via `vono.config.ts` `autoImport.server.dirs`, `autoImport.server.imports`, `autoImport.client.dirs`, and `autoImport.client.imports`.
5. FOR ALL auto-imported symbols, THE generated `.d.ts` files SHALL provide correct TypeScript type information so the editor reports no "cannot find name" errors.

---

### Requirement 47: SSR-Safe Coding Conventions

**User Story:** As a developer, I want the framework to enforce SSR-safe coding patterns, so that server-rendered pages never crash due to browser-only APIs.

#### Acceptance Criteria

1. THE Linter SHALL report a violation for any use of `window`, `document`, or `localStorage` outside of `onMounted()` callbacks or `import.meta.env.SSR === false` guards in `.vue` files.
2. THE Framework SHALL generate a fresh `createApp()` instance per SSR request to prevent shared state across requests.
3. WHEN a component must render differently on server vs client, THE Framework SHALL support `import.meta.env.SSR` as a tree-shakeable boolean guard.
4. THE Framework SHALL support the `data-allow-mismatch` attribute on elements with unavoidable hydration mismatches (e.g., timestamps), suppressing Vue's hydration mismatch warning for those elements.

---

### Requirement 48: ID Generation

**User Story:** As a developer, I want consistent ID generation utilities, so that all records use the same ID format throughout the application.

#### Acceptance Criteria

1. THE Framework SHALL provide a `generateId()` function in `src/shared/utils/id.ts` that returns `crypto.randomUUID()`.
2. THE Framework SHALL provide a `prefixedId(prefix)` function that returns a string in the format `<prefix>_<uuid>` (e.g., `usr_abc123`).
3. FOR ALL calls to `generateId()`, THE returned value SHALL be a valid UUID v4 string matching the pattern `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.
4. FOR ALL calls to `prefixedId(prefix)`, THE returned value SHALL start with `<prefix>_` followed by a valid UUID (round-trip property: splitting on `_` and taking index 0 returns the original prefix).

---

### Requirement 49: SSR Error Handling & Error Pages

**User Story:** As a developer, I want SSR errors to be caught gracefully, so that a rendering failure on one page does not crash the entire server.

#### Acceptance Criteria

1. THE Framework SHALL wrap all SSR rendering in a try/catch so that a `renderToString` error does not propagate to the Hono error handler.
2. WHEN an SSR error occurs and `ssr.fallbackToSpa` is enabled in `vono.config.ts`, THE Server SHALL return the bare SPA shell instead of an error page.
3. THE Framework SHALL support an `error.vue` global error page component that receives an `error` prop with `statusCode`, `message`, `stack` (dev only), and `url`.
4. THE Framework SHALL provide `createError({ statusCode, message })` and `clearError({ redirect? })` utilities for throwing and clearing errors from page components.
5. THE Framework SHALL serve a static fallback HTML error page (HTTP 500) if both SSR rendering and error page rendering fail.

---

### Requirement 50: Upgrade & Versioning Strategy

**User Story:** As a developer, I want a clear upgrade path between Vono versions, so that I can keep my project up to date without manual migration work.

#### Acceptance Criteria

1. THE Framework SHALL follow semantic versioning: patch for bug fixes, minor for backward-compatible features, major for breaking changes.
2. WHEN the developer runs `vono upgrade --check`, THE CLI SHALL report available updates for `vono`, `@vono/cli`, and all installed `@vono/*` modules.
3. WHEN the developer runs `vono upgrade --apply-codemods`, THE CLI SHALL run automated codemods for the current major version upgrade, reporting which changes were applied automatically and which require manual review.
4. EACH `@vono/*` module SHALL declare a `peerDependencies` range for the compatible `vono` core version.

---

### Requirement 51: Queue Driver Support

**User Story:** As a developer, I want to select a queue driver during project setup, so that background jobs, emails, and notifications are processed asynchronously using the best driver for my deployment target.

#### Acceptance Criteria

1. WHEN the developer runs the project wizard, THE CLI SHALL prompt for a queue driver with options: BullMQ + Redis (Bun/Node), Cloudflare Queues (CF Workers only), AWS SQS (Lambda only), Upstash QStash (any runtime), Sync (in-process, dev only), and None.
2. WHEN BullMQ + Redis is selected, THE CLI SHALL install `bullmq` and configure a Redis connection, and this driver SHALL only be available for Bun and Node.js deployment targets.
3. WHEN Cloudflare Queues is selected, THE CLI SHALL configure the queue binding in `wrangler.jsonc`, and this driver SHALL only be available for the Cloudflare Workers deployment target.
4. WHEN AWS SQS is selected, THE CLI SHALL install `@aws-sdk/client-sqs` and configure the SQS queue URL, and this driver SHALL only be available for the Lambda deployment target.
5. WHEN Upstash QStash is selected, THE CLI SHALL install `@upstash/qstash` and configure the QStash token, and this driver SHALL be available for any deployment target.
6. WHEN Sync is selected, THE CLI SHALL process jobs in-process synchronously, and this driver SHALL be recommended for development only.
7. WHEN a queue driver is configured (not None or Sync), THE Framework SHALL dispatch logging and notification events to the queue for async processing.

---

### Requirement 52: Cache Driver Support

**User Story:** As a developer, I want to select a cache driver during project setup, so that frequently accessed data is cached using the best backend for my deployment target.

#### Acceptance Criteria

1. WHEN the developer runs the project wizard, THE CLI SHALL prompt for a cache driver with options: Upstash (works everywhere), Cloudflare KV (CF Workers only), Redis (Bun/Node/Docker), In-memory (dev only), and None.
2. WHEN Upstash is selected, THE CLI SHALL install `@upstash/redis` and configure the Upstash REST URL and token, and this driver SHALL be available for any deployment target.
3. WHEN Cloudflare KV is selected, THE CLI SHALL configure the KV namespace binding in `wrangler.jsonc`, and this driver SHALL only be available for the Cloudflare Workers deployment target.
4. WHEN Redis is selected, THE CLI SHALL configure a Redis connection string, and this driver SHALL only be available for Bun, Node.js, and Docker deployment targets.
5. WHEN In-memory is selected, THE CLI SHALL use a simple in-process Map-based cache, and this driver SHALL be recommended for development only.

---

### Requirement 53: PM2 Process Management Configuration

**User Story:** As a developer, I want the framework to generate a fully configured PM2 ecosystem file tailored to my runtime, so that I have production-grade process management, logging, and graceful restarts out of the box.

#### Acceptance Criteria

1. WHEN the deployment target is Bun, THE CLI SHALL generate an `ecosystem.config.js` with `interpreter: 'bun'`, `exec_mode: 'fork'`, and `instances: 1` because Bun has built-in multi-threading and does not support Node's `cluster` module.
2. WHEN the deployment target is Node.js, THE CLI SHALL generate an `ecosystem.config.js` with `exec_mode: 'cluster'` and `instances: 'max'` to spawn one worker per CPU core via Node's cluster module.
3. THE generated PM2 config SHALL include log configuration with `error_file: './logs/error.log'`, `out_file: './logs/output.log'`, `log_date_format: 'YYYY-MM-DD HH:mm:ss Z'`, and `combine_logs: true`.
4. THE generated PM2 config SHALL include restart policies with `min_uptime: '10s'`, `max_restarts: 10`, `restart_delay: 4000`, `max_memory_restart: '512M'`, `kill_timeout: 5000`, and `autorestart: true`.
5. THE generated PM2 config SHALL include `env` and `env_development` objects with `NODE_ENV` and `PORT` values.
6. WHEN the deployment target is Docker (Bun) or Docker (Node), THE generated Dockerfile SHALL use `pm2-runtime ecosystem.config.js` as the container `CMD` instead of `pm2 start`, so that the process runs in the foreground and Docker can track it.
7. FOR ALL PM2-compatible targets (Bun, Node.js, Docker Bun, Docker Node), THE CLI SHALL create a `logs/` directory in the project root if it does not exist.

---

### Requirement 54: Docker Container Health & Orchestration

**User Story:** As a developer, I want the auto-generated Dockerfile to include health checks and multi-stage optimizations, so that container orchestrators can monitor application health and images stay small.

#### Acceptance Criteria

1. WHEN the deployment target is Docker (Bun), THE CLI SHALL generate a multi-stage Dockerfile using `oven/bun:1` as both the build and runtime base image.
2. WHEN the deployment target is Docker (Node), THE CLI SHALL generate a multi-stage Dockerfile using `node:22-alpine` as the build base and `node:22-alpine` as the runtime base.
3. THE generated Dockerfile SHALL include a `HEALTHCHECK` directive with `--interval=30s --timeout=10s --start-period=5s --retries=3` that executes `curl -f http://127.0.0.1:4000/health || exit 1`.
4. THE generated Dockerfile SHALL `EXPOSE 4000` as the default application port.
5. WHEN a Redis-backed queue driver is selected alongside a Docker deployment target, THE CLI SHALL generate a `docker-compose.yml` with an `app` service (built from the Dockerfile, port-mapped to `${PORT:-4000}:4000`, `restart: unless-stopped`) and a `redis` service (image `redis:7-alpine`, with a health check using `redis-cli ping`, port-mapped to `6379:6379`, with a `redis_data` named volume).
6. WHEN a Redis-backed queue driver is selected alongside a Docker deployment target, THE CLI SHALL generate a `wait-for-redis.sh` entrypoint script that blocks until Redis responds to a `ping` before starting the application.
7. THE docker-compose `app` service SHALL use `depends_on` with `condition: service_healthy` on the `redis` service, so the app only starts after Redis is healthy.

---

### Requirement 55: Drizzle Model Utilities & Query Scopes

**User Story:** As a developer, I want Laravel-style model utility functions and composable query scopes, so that I can perform soft deletes, force deletes, and reusable filtering without repetitive boilerplate.

#### Acceptance Criteria

1. THE Soft_Delete_Helper SHALL expose a `softDelete(db, table, condition)` function that sets `deleted_at` to the current timestamp on records matching the condition and returns the affected record IDs.
2. THE Soft_Delete_Helper SHALL expose a `forceDelete(db, table, condition)` function that permanently removes records matching the condition from the database and returns the affected record IDs.
3. THE Framework SHALL support query scopes as plain functions that return Drizzle `SQL` conditions, defined in `src/modules/<module>/<module>.scopes.ts` files.
4. WHEN the developer runs `vono make:module`, THE CLI SHALL generate a `<module>.scopes.ts` file with example scope stubs (e.g., `active()`, `ownedBy(accountId)`) if the module includes API support.
5. THE Framework SHALL support composing multiple scopes using Drizzle's `and()` and `or()` operators in `WHERE` clauses.
6. FOR ALL valid scope combinations, composing scopes with `and()` SHALL produce a single `WHERE` clause containing all individual conditions (no subquery or N+1 overhead).

---

### Requirement 56: Database Seed Execution

**User Story:** As a developer, I want to run seed scripts via the CLI, so that I can populate development and staging databases with initial data without manual SQL.

#### Acceptance Criteria

1. WHEN the developer runs `vono db:seed`, THE CLI SHALL discover all `*.seed.ts` files in `src/db/seeds/`, execute their exported `seed(db)` functions in alphabetical order, and report which seeds were applied.
2. WHEN the developer runs `vono db:seed <name>`, THE CLI SHALL execute only the named seed file (`src/db/seeds/<name>.seed.ts`) and report success or failure.
3. THE generated seed file SHALL export an `async function seed(db: DrizzleDb)` that receives a connected Drizzle database instance.
4. THE generated seed file SHALL use `onConflictDoNothing()` on insert operations so that running the same seed multiple times is idempotent.
5. WHEN the developer runs `vono migrate:fresh --seed`, THE CLI SHALL drop all tables, re-run all migrations, and then execute all seed files.

---

### Requirement 57: Database Migration CLI Commands

**User Story:** As a developer, I want a full set of Laravel-inspired migration commands, so that I can generate, run, rollback, and inspect database migrations without remembering Drizzle Kit CLI syntax.

#### Acceptance Criteria

1. WHEN the developer runs `vono migrate:run`, THE CLI SHALL execute all pending Drizzle Kit migrations against the configured database.
2. WHEN the developer runs `vono migrate:rollback`, THE CLI SHALL roll back the last batch of applied migrations.
3. WHEN the developer runs `vono migrate:status`, THE CLI SHALL display a list of all migrations with their applied/pending status.
4. WHEN the developer runs `vono migrate:reset`, THE CLI SHALL roll back all applied migrations and then re-run them from the beginning.
5. WHEN the developer runs `vono db:push`, THE CLI SHALL push the current schema directly to the database without generating migration SQL files (development only).
6. WHEN the developer runs `vono db:studio`, THE CLI SHALL launch Drizzle Studio for interactive database browsing.
7. WHEN the developer runs `vono schema:sync`, THE CLI SHALL scan all `*.schema.ts` files under `src/modules/` and regenerate the `src/db/schema.ts` barrel file with updated export statements.
8. THE `vono migrate:make <name>` command SHALL first run `schema:sync` to ensure all module schemas are included, then invoke Drizzle Kit's migration generator.

---

### Requirement 58: Cross-Module Database Relations

**User Story:** As a developer, I want a centralized place to define Drizzle ORM relations between tables in different modules, so that modules stay decoupled while still supporting relational queries.

#### Acceptance Criteria

1. THE Framework SHALL generate a `src/db/relations.ts` file during project scaffolding for defining cross-module Drizzle ORM relations.
2. WHEN two modules' tables reference each other via foreign keys, THE developer SHALL define the relation in `src/db/relations.ts` using Drizzle's `relations()` helper rather than inside individual module schema files.
3. THE `src/db/relations.ts` file SHALL be imported by the `src/db/schema.ts` barrel file so that Drizzle Kit and relational queries can discover all relations.
4. WHEN the developer runs `vono make:module` and the new module's schema references an existing module's table, THE CLI SHALL append a stub relation entry to `src/db/relations.ts`.

---

### Requirement 59: Vono Config Full Schema

**User Story:** As a developer, I want the `vono.config.ts` file to support all framework configuration sections, so that every aspect of the framework can be controlled from a single typed configuration file.

#### Acceptance Criteria

1. THE `defineVonoConfig()` function SHALL accept an `app` object with `name` (string), `url` (string), `env` (string), `key` (string), and `language` (`'ts'` | `'js'`) fields.
2. THE `defineVonoConfig()` function SHALL accept a `runtime` field specifying the deployment target (`'cloudflare-workers'` | `'cloudflare-pages'` | `'bun'` | `'node'` | `'deno'` | `'aws-lambda'` | `'vercel'` | `'netlify'` | `'fastly'`).
3. THE `defineVonoConfig()` function SHALL accept a `mode` field (`'fullstack'` | `'api'`) to control whether frontend files are generated and Vue SSR is enabled.
4. THE `defineVonoConfig()` function SHALL accept a `rateLimit` object with configurable tiers: `auth` (default `windowMs: 300000`, `limit: 5`), `otp` (default `windowMs: 600000`, `limit: 3`), and `api` (default `windowMs: 60000`, `limit: 100`).
5. THE `defineVonoConfig()` function SHALL accept a `payment` object with `driver` (`'paystack'` | `'stripe'` | `'both'`), and driver-specific sub-objects for `paystack` (publicKey, secretKey, webhookSecret) and `stripe` (publishableKey, secretKey, webhookSecret).
6. THE `defineVonoConfig()` function SHALL accept a `docs` object with `swagger` (boolean), `fiberplane` (boolean), and `openapi` (string path) fields to control API documentation endpoints.
7. THE `defineVonoConfig()` function SHALL accept a `test` object with `driver` (`'bun'` | `'vitest'` | `'jest'`) to configure the project's test runner.
8. THE Framework SHALL provide `env(key, fallback?)`, `envNumber(key, fallback)`, `envBool(key, fallback)`, and `envRequired(key)` config helper functions exported from `vono` for use in `vono.config.ts`.

---

### Requirement 60: Runtime Auto-Resolution

**User Story:** As a developer, I want driver selections set to `auto` to resolve automatically based on my deployment target, so that I always get the best backend for my runtime without manual configuration.

#### Acceptance Criteria

1. WHEN the queue driver is set to `'auto'`, THE Framework SHALL resolve to `'bullmq'` for Bun/Node, `'cloudflare-queues'` for Cloudflare Workers/Pages, `'sqs'` for AWS Lambda, and `'upstash'` for Vercel/Netlify/Deno/Fastly.
2. WHEN the storage driver is set to `'auto'`, THE Framework SHALL resolve to `'r2'` for Cloudflare Workers/Pages, and `'local'` for Bun/Node (or `'s3'` if AWS credentials are present in the environment).
3. WHEN the cache driver is set to `'auto'`, THE Framework SHALL resolve to `'kv'` for Cloudflare Workers/Pages, and `'upstash'` for all other runtimes.
4. THE Framework SHALL provide a `resolveQueueDriver(config)`, `resolveStorageDriver(config)`, and `resolveCacheDriver(config)` function in `src/shared/resolvers/` that reads the `runtime` from config and returns the resolved driver name.
5. IF a resolved driver is incompatible with the target runtime (e.g., BullMQ on Cloudflare Workers), THEN THE Framework SHALL throw a descriptive error at startup listing the supported drivers for that runtime.

---

### Requirement 61: Nuxt UI SSR Integration & Icons

**User Story:** As a developer, I want Nuxt UI fully integrated with Vue SSR out of the box, so that components render correctly on both server and client without hydration mismatches.

#### Acceptance Criteria

1. THE Framework SHALL install and configure `@nuxt/ui/vue-plugin` in `src/main.ts` via `app.use(ui)` so that all Nuxt UI components are available without per-component imports.
2. THE Framework SHALL add `class="isolate"` to the `#app` div in `index.html` to prevent Tailwind CSS specificity issues during SSR hydration.
3. THE Framework SHALL configure the `@nuxt/ui/vite` plugin in `vite.config.ts`, passing the `ui.colors` values from `vono.config.ts` to set the `primary` and `neutral` color themes.
4. WHEN the developer installs Iconify icon packages (e.g., `@iconify-json/lucide`, `@iconify-json/simple-icons`), THE Framework SHALL make icons available via Nuxt UI's `<UIcon>` component using the `i-<set>-<name>` naming convention.
5. THE generated `src/App.vue` SHALL wrap `<RouterView />` inside a `<UApp>` component from Nuxt UI to provide the global UI context for dark mode, toast notifications, and modal management.

---

### Requirement 62: Cloudflare Workers Deployment Scripts

**User Story:** As a developer deploying to Cloudflare Workers, I want auto-generated helper scripts for secrets management, so that I can securely upload environment variables without manual `wrangler secret` commands.

#### Acceptance Criteria

1. WHEN the deployment target is Cloudflare Workers, THE CLI SHALL generate a `set-secrets.sh` script that iterates over all required environment variable keys and runs `wrangler secret put <KEY>` for each one.
2. THE `set-secrets.sh` script SHALL read values from the project's `.env` file and pipe them into `wrangler secret put` commands, so that the developer does not need to enter each value interactively.
3. WHEN the deployment target is Cloudflare Workers, THE CLI SHALL generate a `wrangler.jsonc` configuration file with the correct `compatibility_date`, Hyperdrive bindings (if database is PostgreSQL), KV bindings (if cache is Cloudflare KV), R2 bindings (if storage is R2), Queue bindings (if queue is Cloudflare Queues), and `[triggers]` cron entries (if cron jobs are defined).
4. THE generated `wrangler.jsonc` SHALL include `compatibility_flags` appropriate for the project's dependencies (e.g., `nodejs_compat` when using Node.js-compatible APIs).

---

### Requirement 63: Graceful Shutdown Handler

**User Story:** As a developer, I want the server to shut down gracefully on termination signals, so that in-flight requests complete and database connections are closed cleanly before the process exits.

#### Acceptance Criteria

1. THE generated server entry SHALL register a `SIGINT` signal handler that logs a shutdown message, closes all active database connections via `db.$client.end()`, and then calls `process.exit(0)`.
2. THE graceful shutdown handler SHALL complete all cleanup within the PM2 `kill_timeout` window (default 5000ms) to avoid a forced `SIGKILL`.
3. WHEN a queue driver is configured, THE graceful shutdown handler SHALL close queue connections and flush pending jobs before exiting.
4. IF the shutdown handler encounters an error during cleanup, THEN THE handler SHALL log the error and call `process.exit(1)` to signal an unclean exit.

---

### Requirement 64: Configurable Rate Limiting

**User Story:** As a developer, I want rate limiting rules to be configurable in `vono.config.ts` with multiple tiers, so that I can tune throttling for auth endpoints, OTP requests, and general API usage independently.

#### Acceptance Criteria

1. THE Framework SHALL support configuring rate limit tiers in `vono.config.ts` under the `rateLimit` key, with `auth` (default: 5 requests per 5 minutes), `otp` (default: 3 requests per 10 minutes), and `api` (default: 100 requests per minute) tiers.
2. THE generated `rateLimiter.ts` SHALL use a lazy-initialization pattern that defers `setInterval`-based cleanup to the first request, ensuring compatibility with Cloudflare Workers which forbid global-scope timers.
3. THE rate limiter SHALL use `hono-rate-limiter` with `standardHeaders: 'draft-6'` and extract the client IP from `cf-connecting-ip` header (Cloudflare) or `x-forwarded-for` header (other runtimes).
4. WHEN a rate limit is exceeded, THE rate limiter SHALL return HTTP 429 with the standard error response format: `{ success: false, statusCode: 429, message: "Too many attempts, please try again after N minutes." }`.
5. THE Framework SHALL generate separate rate limiter middleware exports for each tier (`authRateLimiter`, `otpRateLimiter`, `apiRateLimiter`) in `src/shared/middleware/rateLimiter.ts`.

---

## Updated Glossary Additions

- **PM2_Config**: The auto-generated `ecosystem.config.js` file that configures PM2 process management for Bun or Node.js deployments.
- **Query_Scope**: A plain function returning a Drizzle `SQL` condition, defined in a module's `*.scopes.ts` file, composable via `and()`/`or()`.
- **Runtime_Resolver**: An internal utility that maps the configured `runtime` value to the correct driver implementation when a driver is set to `'auto'`.
- **Seed_Script**: A TypeScript file in `src/db/seeds/` that exports an `async function seed(db)` for populating the database with initial data.
- **HEALTHCHECK**: A Docker directive in the generated Dockerfile that periodically verifies the application is responding at `GET /health`.
- **Barrel_File**: The auto-generated `src/db/schema.ts` that re-exports all module schemas from a single entry point for Drizzle Kit.
- **Config_Helper**: Type-safe environment variable reader functions (`env()`, `envNumber()`, `envBool()`, `envRequired()`) used in `vono.config.ts`.
