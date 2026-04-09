# Vonosan — The Hono + Vue Full-Stack Framework

> **Vonosan** (Vue + Hono) — a batteries-included full-stack TypeScript/JavaScript framework. Hono API + Vue frontend in one codebase, with hybrid SSR, Nuxt UI, Drizzle ORM, auto-imports, and a Laravel-style CLI. Deploy anywhere Hono runs.

```
bun create vonosan@latest my-app
```

---

## Table of Contents

0. [Package Architecture — npm Packages](#0-package-architecture--npm-packages)
1. [Architecture](#1-architecture)
2. [Project Structure](#2-project-structure)
3. [Route Rules System (Nuxt-style Hybrid Rendering)](#3-route-rules-system)
4. [Complete Implementation](#4-complete-implementation)
5. [SEO Layer — Meta Tags, Structured Data, Sitemap](#5-seo-layer)
6. [Streaming SSR for Maximum TTFB](#6-streaming-ssr)
7. [Pinia State Management with SSR](#7-pinia-state-management-with-ssr)
8. [Build & Development](#8-build--development)
9. [Deployment Targets](#9-deployment-targets)
10. [SSR-Safe Coding Rules](#10-ssr-safe-coding-rules)
11. [What You Lose vs Nuxt (And How to Replace It)](#11-what-you-lose-vs-nuxt)
12. [Hono.js Production API Architecture (from WazobiaMail)](#12-hono-production-api-architecture)
13. [Vono CLI — Installation Wizard](#13-vono-cli--installation-wizard)
14. [Auto-Imports — Server & Client](#14-auto-imports--server--client)
15. [Nuxt UI — Default Frontend UI](#15-nuxt-ui--default-frontend-ui)
16. [Vono Artisan — Scaffolding CLI](#16-vono-artisan--scaffolding-cli)
17. [Migrations & Module Schemas](#17-migrations--module-schemas)
18. [Model Sugar — Soft Deletes, Scopes, Timestamps](#18-model-sugar--soft-deletes-scopes-timestamps)
19. [Vono Config — Runtime-Aware Configuration System](#19-vono-config--runtime-aware-configuration-system)
20. [Gates & Policies — Authorization](#20-gates--policies--authorization)
21. [Resources — API Response Transformers (Optional)](#21-resources--api-response-transformers-optional)
22. [PM2 Deployment — Process Management](#22-pm2-deployment--process-management)
23. [WebSocket & Real-Time](#23-websocket--real-time)
24. [Auth Scaffolding — Pages, APIs & Composables](#24-auth-scaffolding--pages-apis--composables)
25. [Notifications — In-App Alerts & Preferences](#25-notifications--in-app-alerts--preferences)
26. [Logging — Activity & Audit Trail](#26-logging--activity--audit-trail)
27. [Vite Plugin — Framework Core](#27-vite-plugin--framework-core)
28. [Vono Composables — Client Runtime](#28-vono-composables--client-runtime)
29. [Plugin / Module System — `defineVonoModule()`](#29-plugin--module-system--definevonomodule)
30. [SSR Error Handling & Error Pages](#30-ssr-error-handling--error-pages)
31. [Environment Validation — Zod-Powered Env Safety](#31-environment-validation--zod-powered-env-safety)
32. [Database Connection Pooling](#32-database-connection-pooling)
33. [Database Transactions](#33-database-transactions)
34. [CORS Configuration](#34-cors-configuration)
35. [File Uploads & Storage](#35-file-uploads--storage)
36. [Cron / Scheduled Jobs](#36-cron--scheduled-jobs)
37. [Email Templates](#37-email-templates)
38. [i18n / Localization](#38-i18n--localization)
39. [Layout System](#39-layout-system)
40. [Upgrade & Versioning Strategy](#40-upgrade--versioning-strategy)

---

## 0. Package Architecture — npm Packages

Vonosan ships as multiple npm packages with clear boundaries:

| Package | Purpose | Install |
|---|---|---|
| `create-vonosan` | Project scaffolder (interactive wizard) | `bun create vonosan@latest my-app` |
| `vonosan` | Core runtime — config, composables, SSR helpers, Vite plugin | `bun add vonosan` (auto-installed) |
| `@vonosan/cli` | Artisan-style scaffolding CLI (`vono make:module`, `vono migrate`, etc.) | `bun add -D @vonosan/cli` |
| `@vonosan/drizzle` | Drizzle ORM integration — mixins, soft deletes, scopes, seed helpers | `bun add @vonosan/drizzle` |
| `@vonosan/auth` | Authentication module — JWT, OAuth, magic link, pages, composables | `vono add auth` |
| `@vonosan/notifications` | In-app notification module — DB, API, composables, pages | `vono add notifications` |
| `@vonosan/logging` | Activity/audit logging module | `vono add logging` |
| `@vonosan/ws` | WebSocket module — adapter-based (native, socket.io, CF) | `vono add ws` |

### What ships in `vonosan` (core):

**Subpath exports (`package.json` exports map):**

| Import | Contents |
|---|---|
| `vonosan` | `defineVonoConfig()`, `useVonoConfig()` |
| `vonosan/vite` | Vite plugin — SSR, auto-imports, dev server, HMR |
| `vonosan/server` | Server-side helpers — `success()`, `error()`, `paginate()`, middleware factories |
| `vonosan/client` | Client-side composables — `useAsyncData()`, `useCookie()`, `useState()`, `useVonoFetch()`, `navigateTo()` |
| `vonosan/types` | Shared TypeScript types — `VonoConfig`, `AppVariables`, `ModuleDefinition` |

### What lives in user-land (generated into the project):

- `src/modules/**` — user's feature modules (routes, controllers, services, pages)
- `src/db/schema.ts` — barrel file importing all module schemas
- `src/shared/` — shared middleware, utils, components, composables
- `vono.config.ts` — project configuration
- `src/index.ts`, `src/main.ts`, `src/app.ts`, `src/server.ts` — app entry points

### Boundary rule:

> **Framework code** (in `node_modules/vonosan`) handles wiring, conventions, and defaults.
> **User code** (in `src/`) owns business logic. Generated once, then fully owned by the developer.
> **Modules** (`@vonosan/auth`, etc.) can be installed as dependencies OR scaffolded as user code via `vono add auth --eject`.

---

## 1. Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Single Hono Server                      │
│                                                            │
│  /api/*  ──────────► Hono API routes (JSON)                │
│                                                            │
│  /           ──────► SSR (renderToString → full HTML)      │
│  /about      ──────► SSR                                   │
│  /pricing    ──────► SSR                                   │
│  /blog/*     ──────► SSR (SEO-critical content)            │
│                                                            │
│  /dashboard/*──────► SPA (client-only, no SSR)             │
│  /admin/*    ──────► SPA (behind auth, no SEO needed)      │
│  /settings/* ──────► SPA                                   │
│                                                            │
│  /robots.txt ──────► Dynamic robots.txt                    │
│  /sitemap.xml──────► Auto-generated sitemap                │
└────────────────────────────────────────────────────────────┘
```

The server decides **per-route** whether to SSR the Vue app or serve a bare SPA shell. Public-facing pages get full SSR with meta tags, structured data, and streaming. Dashboard/admin pages skip SSR entirely and behave as a normal SPA.

---

## 2. Project Structure

Everything lives in one flat project. **Every feature is a module** — API code (routes, controller, service, DTO) and frontend code (`*.page.vue` pages, components, composables, stores) live together in the same module folder. Routes are **file-based** — any `*.page.vue` file inside a module automatically becomes a route (like Nuxt). Whether you're building API-only, frontend-only, or full-stack, the structure is identical.

```
my-app/
├── public/                          # Static assets (copied as-is)
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── index.ts                     # App entry — outer app + versioned API router
│   ├── openapi.ts                   # OpenAPI 3.1 spec object
│   ├── router.ts                    # Vue Router factory (uses auto-generated file-based routes)
│   ├── route-rules.ts               # Per-route rendering config (SSR/SPA/ISR)
│   ├── main.ts                      # Shared Vue app factory
│   ├── app.ts                       # Client hydration / SPA mount
│   ├── server.ts                    # Server render function
│   ├── App.vue                      # Root Vue component (<UApp><RouterView/></UApp>)
│   ├── db/
│   │   ├── index.ts                 # createDb() — Drizzle client factory
│   │   ├── schema.ts                # Auto-imports & re-exports all module schemas
│   │   ├── mixins/                  # timestamps, softDeletable
│   │   └── seeds/                   # Seed scripts (plans, roles, countries)
│   ├── lib/                         # Pure utility libraries (no Hono context)
│   │   ├── auth.ts                  # JWT sign/verify, password hashing, OTP
│   │   ├── country-lookup.ts
│   │   └── totp.ts
│   ├── shared/                      # Cross-cutting concerns (used by all modules)
│   │   ├── dto/
│   │   │   └── query.dto.ts         # Shared pagination/filter Zod schema
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT auth + role guards (authMiddleware, isAdmin)
│   │   │   ├── apikey.middleware.ts  # API key auth (vono_* tokens)
│   │   │   ├── configProvider.ts     # Reads env vars → c.var.config
│   │   │   ├── dbProvider.ts         # Creates Drizzle client → c.var.db
│   │   │   ├── rateLimiter.ts        # Rate limiting (lazy init for CF Workers)
│   │   │   └── validator.ts          # Zod validator wrapper (422 format)
│   │   ├── utils/
│   │   │   ├── id.ts                 # generateId(), prefixedId()
│   │   │   ├── pagination.ts         # buildPaginationMeta()
│   │   │   ├── response.ts           # success() / error() envelope helpers
│   │   │   ├── softDeletes.ts        # withSoftDeletes(), onlyTrashed(), restore()
│   │   │   └── autoRoutes.ts         # Auto-discovers & mounts *.routes.ts modules
│   │   ├── components/               # Shared Vue components (used across modules)
│   │   │   ├── AppNavbar.vue
│   │   │   ├── AppLoader.vue
│   │   │   └── SeoHead.vue
│   │   ├── composables/              # Shared Vue composables
│   │   │   ├── useSeo.ts
│   │   │   ├── useRouteRules.ts
│   │   │   └── useFormErrors.ts
│   │   └── layouts/                  # Vue layout components
│   │       ├── default.vue
│   │       ├── dashboard.vue
│   │       └── admin.vue
│   ├── types/
│   │   └── index.ts                  # AuthAccount, Env, Config, AppVariables
│   └── modules/                      # ← ALL features live here
│       ├── auth/                     #    Each module is self-contained:
│       │   ├── auth.routes.ts        #    API — Hono sub-app (routes)
│       │   ├── auth.controller.ts    #    API — HTTP → Service bridge
│       │   ├── auth.service.ts       #    API — Business logic + DB
│       │   ├── auth.dto.ts           #    API — Zod schemas + types
│       │   ├── auth.schema.ts        #    DB — Drizzle table definitions (auto-imported to schema.ts)
│       │   ├── login.page.vue        #    Frontend — file-based route → /auth/login
│       │   ├── register.page.vue     #    Frontend — file-based route → /auth/register
│       │   ├── forgot-password.page.vue  # → /auth/forgot-password
│       │   ├── reset-password.page.vue   # → /auth/reset-password
│       │   ├── components/           #    Frontend — Module-specific components
│       │   │   └── RegistrationWizard.vue
│       │   └── composables/          #    Frontend — Module-specific composables
│       │       └── useAuth.ts
│       ├── dashboard/
│       │   ├── dashboard.routes.ts
│       │   ├── dashboard.controller.ts
│       │   ├── dashboard.service.ts
│       │   ├── index.page.vue         # → /dashboard
│       │   ├── profile.page.vue       # → /dashboard/profile
│       │   ├── settings.page.vue      # → /dashboard/settings
│       │   ├── sessions.page.vue      # → /dashboard/sessions
│       │   ├── notifications.page.vue # → /dashboard/notifications
│       │   ├── components/
│       │   │   └── DashboardChart.vue
│       │   └── composables/
│       │       ├── useDashboard.ts
│       │       ├── useProfile.ts
│       │       ├── useNotifications.ts
│       │       └── useSessions.ts
│       ├── domains/
│       │   ├── domains.routes.ts
│       │   ├── domains.controller.ts
│       │   ├── domains.service.ts
│       │   ├── domains.dto.ts
│       │   ├── index.page.vue         # → /domains
│       │   ├── [id].page.vue          # → /domains/:id (dynamic route)
│       │   └── composables/
│       │       └── useDomains.ts
│       ├── billing/
│       │   ├── billing.routes.ts
│       │   ├── billing.controller.ts
│       │   ├── billing.service.ts
│       │   ├── billing.dto.ts
│       │   ├── index.page.vue         # → /billing
│       │   └── composables/
│       │       └── useBilling.ts
│       ├── admin/
│       │   ├── admin.routes.ts
│       │   ├── admin.controller.ts
│       │   ├── admin.service.ts
│       │   ├── index.page.vue         # → /admin
│       │   ├── users.page.vue         # → /admin/users
│       │   ├── domains.page.vue       # → /admin/domains
│       │   ├── billing.page.vue       # → /admin/billing
│       │   ├── support.page.vue       # → /admin/support
│       │   ├── logs.page.vue          # → /admin/logs
│       │   ├── settings.page.vue      # → /admin/settings
│       │   └── composables/
│       │       └── useAdmin.ts
│       ├── webhooks/
│       ├── notifications/
│       ├── support/
│       ├── audit-logs/
│       ├── ...                        #    (your feature modules here)
│       └── payment/
│           ├── payment.routes.ts
│           ├── payment.controller.ts
│           ├── payment.service.ts
│           ├── payment.dto.ts
│           ├── payment.schema.ts
│           └── composables/
│               └── usePayment.ts
├── assets/
│   └── css/
│       └── main.css                  # @import "tailwindcss"; @import "@nuxt/ui";
├── drizzle/                          # Migration files (.sql)
├── tests/                            # Test files
├── index.ts                          # Hono server entry (production)
├── index.html                        # HTML shell template
├── vono.config.ts                    # Framework config
├── vite.config.ts
├── drizzle.config.ts
├── tsconfig.json
├── .env
└── package.json
```

**The rule is simple:** If code belongs to a feature, it goes in that module. Shared code (used by 2+ modules) goes in `src/shared/`. Pages are `*.page.vue` files — they live directly in the module folder (not in a `pages/` subfolder) and are auto-discovered as routes by Vue Router v5. This applies whether you're building:

- **Full-stack** — modules have API + `*.page.vue` pages + composables
- **API only** — modules have routes + controller + service + dto (no `*.page.vue` or `components/` folders)
- **Frontend only** — modules have `*.page.vue` pages + components + composables (no API files)

No `client/` folder. No `server/` folder. One root. One `package.json`.

---

## 3. Route Rules System

This is the core of hybrid rendering. A config object maps URL patterns to rendering modes — exactly like Nuxt's `routeRules`.

### `src/route-rules.ts`

```ts
export type RenderMode = 'ssr' | 'spa' | 'prerender'

export interface RouteRule {
  /** How this route renders */
  mode: RenderMode
  /** Cache-Control header value (seconds). Only for SSR/prerender. */
  cache?: number
  /** SWR: serve stale while revalidating in background */
  swr?: boolean
}

/**
 * Route rules config — Nuxt-style hybrid rendering.
 *
 * Patterns are matched top-to-bottom. First match wins.
 * Use '**' for wildcard segments.
 *
 * IMPORTANT: More specific patterns must come before broader ones.
 */
export const routeRules: Record<string, RouteRule> = {
  // ── Public pages: SSR for SEO ─────────────────────────
  '/':              { mode: 'ssr', cache: 3600 },
  '/about':         { mode: 'ssr', cache: 86400 },
  '/pricing':       { mode: 'ssr', cache: 3600 },
  '/blog':          { mode: 'ssr', cache: 600, swr: true },
  '/blog/**':       { mode: 'ssr', cache: 1800, swr: true },
  '/contact':       { mode: 'ssr', cache: 86400 },
  '/terms':         { mode: 'ssr', cache: 86400 },
  '/privacy':       { mode: 'ssr', cache: 86400 },

  // ── App pages: SPA only (no SSR, behind auth) ────────
  '/dashboard/**':  { mode: 'spa' },
  '/admin/**':      { mode: 'spa' },
  '/settings/**':   { mode: 'spa' },
  '/onboarding/**': { mode: 'spa' },
}

/** Default rule if no pattern matches */
export const defaultRule: RouteRule = { mode: 'ssr' }

/**
 * Match a URL path against route rules.
 * Supports exact match and glob-style '**' wildcards.
 */
export function resolveRouteRule(path: string): RouteRule {
  for (const [pattern, rule] of Object.entries(routeRules)) {
    if (matchPattern(pattern, path)) return rule
  }
  return defaultRule
}

function matchPattern(pattern: string, path: string): boolean {
  // Exact match
  if (pattern === path) return true

  // Wildcard: '/blog/**' matches '/blog/my-post' and '/blog/2024/foo'
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3) // remove '/**'
    return path === prefix || path.startsWith(prefix + '/')
  }

  return false
}
```

---

## 4. Complete Implementation

Every file below lives in the project root. Copy them as-is.

### `package.json`

```json
{
  "name": "my-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build --outDir dist/client && vite build --outDir dist/server --ssr src/server.ts",
    "preview": "NODE_ENV=production node server-prod.js"
  },
  "dependencies": {
    "hono": "^4.7.0",
    "@hono/node-server": "^1.14.0",
    "vue": "^3.5.0",
    "vue-router": "^5.0.0",
    "pinia": "^3.0.0",
    "@unhead/vue": "^2.0.0",
    "@unhead/ssr": "^2.0.0",
    "unhead": "^2.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.0",
    "@hono/vite-dev-server": "^0.18.0",
    "vite": "^6.2.0",
    "typescript": "^5.7.0",
    "vue-tsc": "^2.2.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*", "index.ts", "*.d.ts"]
}
```

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!--head-outlet-->
</head>
<body>
  <div id="app"><!--ssr-outlet--></div>
  <script type="module" src="/src/app.ts"></script>
  <!--state-outlet-->
</body>
</html>
```

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import devServer from '@hono/vite-dev-server'

export default defineConfig({
  plugins: [
    devServer({
      entry: './index.ts',
      exclude: [
        /.*\.vue($|\?)/,
        /^\/(public|assets|static)\/.+/,
        /.*\.(s?css|less)($|\?)/,
        /.*\.(svg|png|jpg|jpeg|gif|ico|woff2?)($|\?)/,
      ]
    }),
    vue(),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
})
```

---

### `src/router.ts` — Vue Router with File-Based Routing

Routes are **auto-generated** from `*.page.vue` files inside modules. No manual route definitions needed. Vue Router v5 scans each module folder and turns every `*.page.vue` file into a route — just like Nuxt does with `pages/`.

```ts
import {
  createRouter as _createRouter,
  createMemoryHistory,
  createWebHistory,
} from 'vue-router'
import { routes } from 'vue-router/auto-routes'

export function createRouter(isServer: boolean) {
  return _createRouter({
    history: isServer ? createMemoryHistory() : createWebHistory(),
    // Routes auto-generated from *.page.vue files in modules
    routes,
  })
}
```

**How it works:** The `VueRouter` Vite plugin (from `vue-router/vite`) scans all configured `routesFolder` directories for `*.page.vue` files at build time and generates the `routes` array automatically. The file name becomes the route path:

| File | Route |
|---|---|
| `modules/auth/login.page.vue` | `/auth/login` |
| `modules/auth/register.page.vue` | `/auth/register` |
| `modules/dashboard/index.page.vue` | `/dashboard` |
| `modules/dashboard/profile.page.vue` | `/dashboard/profile` |
| `modules/domains/index.page.vue` | `/domains` |
| `modules/domains/[id].page.vue` | `/domains/:id` |
| `modules/domains/[id]/settings.page.vue` | `/domains/:id/settings` |
| `modules/admin/index.page.vue` | `/admin` |
| `modules/admin/users.page.vue` | `/admin/users` |
| `modules/billing/invoices/[id].page.vue` | `/billing/invoices/:id` |
| `modules/blog/[...slug].page.vue` | `/blog/:slug(.*)` (catch-all) |

**File-based routing conventions** (same as Nuxt):

| Convention | Example | Route |
|---|---|---|
| `index.page.vue` | Module root | `/module` |
| `about.page.vue` | Static segment | `/module/about` |
| `[id].page.vue` | Dynamic param | `/module/:id` |
| `[[id]].page.vue` | Optional param | `/module/:id?` |
| `[id]+.page.vue` | Repeatable param | `/module/:id+` |
| `[[id]]+.page.vue` | Optional repeatable | `/module/:id*` |
| `[...slug].page.vue` | Catch-all | `/module/:slug(.*)` |
| Nested folders | `users/[id]/edit.page.vue` | `/module/users/:id/edit` |
| `(group)/` folder | `(admin)/dashboard.page.vue` | `/dashboard` (no URL segment) |

**Per-page meta with `definePage()`:** Each page can define its own route meta (title, layout, middleware) using the `definePage()` compiler macro — no need to touch a central router file:

```vue
<!-- src/modules/auth/login.page.vue -->
<template>
  <UCard class="max-w-md mx-auto mt-20">
    <h1 class="text-2xl font-bold">Sign In</h1>
    <!-- login form -->
  </UCard>
</template>

<script setup lang="ts">
definePage({
  meta: {
    title: 'Sign In — MyApp',
    description: 'Sign in to your account.',
    layout: 'auth',       // uses src/shared/layouts/auth.vue
  },
})
</script>
```

```vue
<!-- src/modules/domains/[id].page.vue -->
<template>
  <div>
    <h1>Domain: {{ route.params.id }}</h1>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

definePage({
  meta: {
    title: 'Domain Details',
    requiresAuth: true,
  },
})
</script>
```

```vue
<!-- src/modules/blog/[...slug].page.vue -->
<template>
  <article v-if="post">
    <h1>{{ post.title }}</h1>
    <div v-html="post.content" />
  </article>
</template>

<script setup lang="ts">
const route = useRoute()
const post = ref(null)

definePage({
  meta: { layout: 'default' },
})

onServerPrefetch(async () => {
  const res = await fetch(`/api/blog/${route.params.slug}`)
  post.value = await res.json()
})
</script>
```

**Vite plugin config** (in `vite.config.ts`):

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'

export default defineConfig({
  plugins: [
    // VueRouter MUST come before Vue
    VueRouter({
      // Scan module folders for *.page.vue files
      routesFolder: [
        {
          src: 'src/modules',
          // Each module name becomes a route prefix:
          // src/modules/auth/login.page.vue → /auth/login
          // src/modules/dashboard/index.page.vue → /dashboard
        },
      ],
      // Only pick up *.page.vue files (ignore components, composables, etc.)
      extensions: ['.page.vue'],
      // Strip the .page suffix from the generated route paths
      filePatterns: ['**/*.page'],
      dts: 'src/route-map.d.ts',
    }),
    vue(),
  ],
})
```

> **Why `.page.vue`?** Module folders contain many `.vue` files (components, layouts, etc.). The `.page.vue` suffix tells the router plugin which files are actual pages — everything else is ignored. This is the same pattern used by frameworks like Analog (Angular) and Iles.
```

---

### `src/main.ts` — Shared App Factory

```ts
import { createSSRApp, createApp as createSPAApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue'
import { createRouter } from './router'
import { resolveRouteRule } from './route-rules'
import App from './App.vue'

interface CreateAppOptions {
  isServer: boolean
  url?: string  // only needed on server
}

export function createApp({ isServer, url }: CreateAppOptions) {
  // Determine render mode from route rules
  const renderMode = url ? resolveRouteRule(url).mode : 'ssr'

  // Use createSSRApp for SSR routes, regular createApp conceptually
  // (but createSSRApp works for both — it enables hydration on client)
  const app = createSSRApp(App)

  const router = createRouter(isServer)
  const pinia = createPinia()
  const head = createHead()

  app.use(router)
  app.use(pinia)
  app.use(head)

  // Provide render mode so components can check it
  app.provide('renderMode', renderMode)

  return { app, router, pinia, head }
}
```

---

### `src/server.ts` — Server Render (SSR + SPA hybrid)

```ts
import { renderToString } from 'vue/server-renderer'
import { renderSSRHead } from '@unhead/ssr'
import { createApp } from './main'
import { resolveRouteRule, type RouteRule } from './route-rules'

export interface RenderResult {
  html: string
  head: string
  bodyAttrs: string
  htmlAttrs: string
  piniaState: string
  rule: RouteRule
}

export async function render(url: string): Promise<RenderResult> {
  const rule = resolveRouteRule(url)

  // ── SPA mode: return empty shell (no server rendering) ──
  if (rule.mode === 'spa') {
    return {
      html: '',
      head: '<title>MyApp</title>',
      bodyAttrs: '',
      htmlAttrs: '',
      piniaState: '',
      rule,
    }
  }

  // ── SSR mode: full server render ────────────────────────
  const { app, router, pinia, head } = createApp({
    isServer: true,
    url,
  })

  await router.push(url)
  await router.isReady()

  const ctx: Record<string, any> = {}
  const html = await renderToString(app, ctx)

  // Extract head tags (title, meta, og, structured data)
  const headPayload = await renderSSRHead(head)

  // Serialize Pinia state for client hydration
  const piniaState = JSON.stringify(pinia.state.value)

  return {
    html,
    head: headPayload.headTags,
    bodyAttrs: headPayload.bodyAttrs,
    htmlAttrs: headPayload.htmlAttrs,
    piniaState,
    rule,
  }
}
```

---

### `src/app.ts` — Client Hydration (SSR) or Mount (SPA)

```ts
import { createApp } from './main'
import { resolveRouteRule } from './route-rules'

async function main() {
  const url = window.location.pathname
  const rule = resolveRouteRule(url)

  const { app, router, pinia } = createApp({
    isServer: false,
    url,
  })

  // Hydrate Pinia state from server (if SSR'd)
  const stateEl = document.getElementById('__pinia')
  if (stateEl?.textContent) {
    pinia.state.value = JSON.parse(stateEl.textContent)
  }

  await router.isReady()

  // SSR pages: hydrate (attach to existing DOM)
  // SPA pages: mount fresh (render into empty #app)
  app.mount('#app')
}

main()
```

---

### `index.ts` — Hono Server with Hybrid Rendering

```ts
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'node:fs'
import { apiRouter } from './src/api/index'
import { resolveRouteRule } from './src/route-rules'

const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT) || 4000

// Read HTML template once at startup
const templateHtml = readFileSync(
  isProduction ? './dist/client/index.html' : './index.html',
  'utf-8'
)

const app = new Hono()

// ═══════════════════════════════════════════════════════
//  1. API ROUTES — pure JSON, no HTML
// ═══════════════════════════════════════════════════════
app.route('/api', apiRouter)

// ═══════════════════════════════════════════════════════
//  2. SEO ENDPOINTS — robots.txt, sitemap.xml
// ═══════════════════════════════════════════════════════
app.get('/robots.txt', (c) => {
  return c.text([
    'User-agent: *',
    'Allow: /',
    'Disallow: /dashboard',
    'Disallow: /admin',
    'Disallow: /settings',
    'Disallow: /api',
    '',
    `Sitemap: ${new URL('/sitemap.xml', c.req.url).href}`,
  ].join('\n'))
})

app.get('/sitemap.xml', (c) => {
  const baseUrl = new URL(c.req.url).origin
  const pages = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/about', changefreq: 'monthly', priority: '0.8' },
    { loc: '/pricing', changefreq: 'weekly', priority: '0.9' },
    { loc: '/blog', changefreq: 'daily', priority: '0.9' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.5' },
    { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
    { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
    // Add dynamic blog posts here from DB
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`
  return c.body(xml, { headers: { 'Content-Type': 'application/xml' } })
})

// ═══════════════════════════════════════════════════════
//  3. STATIC ASSETS (production)
// ═══════════════════════════════════════════════════════
if (isProduction) {
  app.use('/assets/*', serveStatic({
    root: './dist/client',
    // Immutable cache for hashed assets
    onFound: (_path, c) => {
      c.header('Cache-Control', 'public, max-age=31536000, immutable')
    },
  }))
}

app.use('/favicon.ico', serveStatic({ path: './public/favicon.ico' }))
app.use('/images/*', serveStatic({ root: './public' }))

// ═══════════════════════════════════════════════════════
//  4. VUE RENDERING — SSR or SPA per route
// ═══════════════════════════════════════════════════════
app.get('/*', async (c) => {
  const url = new URL(c.req.url).pathname
  const rule = resolveRouteRule(url)

  // Import the render function
  let render: typeof import('./src/server')['render']
  if (isProduction) {
    const mod = await import('./dist/server/server.js')
    render = mod.render
  } else {
    const mod = await import('./src/server.ts')
    render = mod.render
  }

  const result = await render(url)

  // Build final HTML
  let html = templateHtml
    .replace('<!--ssr-outlet-->', result.html)
    .replace('<!--head-outlet-->', result.head)

  // Inject Pinia state for hydration (only if SSR'd)
  if (rule.mode === 'ssr' && result.piniaState && result.piniaState !== '{}') {
    const stateScript = `<script id="__pinia" type="application/json">${
      result.piniaState
        .replace(/</g, '\\u003c')   // Prevent XSS via </script> injection
        .replace(/>/g, '\\u003e')
    }</script>`
    html = html.replace('<!--state-outlet-->', stateScript)
  } else {
    html = html.replace('<!--state-outlet-->', '')
  }

  // Apply htmlAttrs and bodyAttrs if present
  if (result.htmlAttrs) {
    html = html.replace('<html lang="en">', `<html lang="en" ${result.htmlAttrs}>`)
  }
  if (result.bodyAttrs) {
    html = html.replace('<body>', `<body ${result.bodyAttrs}>`)
  }

  // Set caching headers
  if (rule.cache && isProduction) {
    const cacheHeader = rule.swr
      ? `public, max-age=${rule.cache}, stale-while-revalidate=${rule.cache * 2}`
      : `public, max-age=${rule.cache}`
    c.header('Cache-Control', cacheHeader)
  }

  // SPA pages get noindex header (redundant safety with robots.txt)
  if (rule.mode === 'spa') {
    c.header('X-Robots-Tag', 'noindex, nofollow')
  }

  return c.html(html)
})

export default app
```

---

### `src/api/index.ts` — API Routes (auto-registered)

Routes are auto-discovered from `src/modules/*/`. No manual imports needed:

```ts
import { Hono } from 'hono'
import { autoRegisterRoutes } from '../shared/utils/autoRoutes'

export const apiRouter = new Hono()

// Auto-registers all *.routes.ts files from src/modules/*/
await autoRegisterRoutes(apiRouter)
```

### `src/shared/utils/autoRoutes.ts` — Route Auto-Registration

```ts
import type { Hono } from 'hono'

/**
 * Auto-discovers and mounts all *.routes.ts files from src/modules/*/.
 * Each module exports a Hono sub-app as its default export.
 * The route prefix is derived from the module folder name.
 *
 * Convention:
 *   src/modules/auth/auth.routes.ts  → /auth
 *   src/modules/payment/payment.routes.ts  → /payment
 */
export async function autoRegisterRoutes(app: Hono) {
  const modules = import.meta.glob<{ default: Hono }>(
    '../modules/*/*.routes.ts',
    { eager: true }
  )

  for (const [path, mod] of Object.entries(modules)) {
    // Extract module name: "../modules/auth/auth.routes.ts" → "auth"
    const match = path.match(/\/modules\/([^/]+)\//)
    if (!match) continue

    const prefix = `/${match[1]}`
    app.route(prefix, mod.default)
  }
}
```

Now adding a new module is **zero-config** — just create `src/modules/billing/billing.routes.ts` with a default export and it's auto-mounted at `/billing`.

### Example Module Routes

```ts
// src/modules/auth/auth.routes.ts
const routes = new Hono()

routes.post('/login', authController.login)
routes.post('/register', authController.register)
routes.post('/logout', authMiddleware, authController.logout)

export default routes
```

```ts
// src/modules/health/health.routes.ts
const routes = new Hono()

routes.get('/', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

export default routes
```

---

### `src/App.vue`

```vue
<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from './components/AppLayout.vue'
</script>
```

---

## 5. SEO Layer

This is where bulletproof SEO lives. Every SSR'd page gets proper `<title>`, `<meta>`, Open Graph, Twitter Card, canonical URL, and JSON-LD structured data — all server-rendered in the initial HTML response.

### `src/composables/useSeo.ts`

```ts
import { useHead, useServerHead } from '@unhead/vue'

interface SeoOptions {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: string
  twitterCard?: 'summary' | 'summary_large_image'
  noIndex?: boolean
  structuredData?: Record<string, any>
}

/**
 * Sets all SEO meta tags for the current page.
 * Works in both SSR and client — tags are server-rendered into HTML.
 */
export function useSeo(options: SeoOptions) {
  const baseUrl = import.meta.env.SSR
    ? (process.env.BASE_URL || 'https://myapp.com')
    : window.location.origin

  const canonical = options.canonical
    ? `${baseUrl}${options.canonical}`
    : undefined

  const ogImage = options.ogImage
    ? (options.ogImage.startsWith('http') ? options.ogImage : `${baseUrl}${options.ogImage}`)
    : `${baseUrl}/images/og-default.png`

  useHead({
    title: options.title,
    meta: [
      // ── Core ──────────────────────────
      { name: 'description', content: options.description },
      ...(options.noIndex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),

      // ── Open Graph ────────────────────
      { property: 'og:title', content: options.title },
      { property: 'og:description', content: options.description },
      { property: 'og:type', content: options.ogType || 'website' },
      { property: 'og:image', content: ogImage },
      ...(canonical ? [{ property: 'og:url', content: canonical }] : []),

      // ── Twitter Card ──────────────────
      { name: 'twitter:card', content: options.twitterCard || 'summary_large_image' },
      { name: 'twitter:title', content: options.title },
      { name: 'twitter:description', content: options.description },
      { name: 'twitter:image', content: ogImage },
    ],
    link: [
      ...(canonical ? [{ rel: 'canonical', href: canonical }] : []),
    ],
    // ── JSON-LD Structured Data ─────────
    script: options.structuredData
      ? [{
          type: 'application/ld+json',
          innerHTML: JSON.stringify(options.structuredData),
        }]
      : [],
  })
}
```

### Usage in a page component — `src/modules/home/index.page.vue`

```vue
<template>
  <main>
    <h1>Welcome to MyApp</h1>
    <p>The best solution for your needs.</p>
  </main>
</template>

<script setup lang="ts">
import { useSeo } from '@/composables/useSeo'

definePage({
  meta: {
    title: 'MyApp — The Best Solution for Your Needs',
    description: 'MyApp helps teams collaborate, ship faster, and grow. Start free today.',
  },
})

useSeo({
  title: 'MyApp — The Best Solution for Your Needs',
  description: 'MyApp helps teams collaborate, ship faster, and grow. Start free today.',
  canonical: '/',
  ogImage: '/images/og-home.png',
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MyApp',
    url: 'https://myapp.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://myapp.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
})
</script>
```

### Usage for a dynamic blog post — `src/modules/blog/[...slug].page.vue`

```vue
<template>
  <article v-if="post">
    <h1>{{ post.title }}</h1>
    <time :datetime="post.date">{{ post.date }}</time>
    <div v-html="post.content" />
  </article>
</template>

<script setup lang="ts">
import { ref, onServerPrefetch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSeo } from '@/composables/useSeo'

const route = useRoute()
const post = ref<{ title: string; date: string; content: string; excerpt: string; image: string } | null>(null)

definePage({
  meta: { layout: 'default' },
})

async function fetchPost() {
  const res = await fetch(`/api/blog/${route.params.slug}`)
  post.value = await res.json()
}

// Fetch on server during SSR (executes before renderToString completes)
onServerPrefetch(fetchPost)

// Also fetch on client for SPA navigation
onMounted(() => {
  if (!post.value) fetchPost()
})

// Dynamic SEO once data is available
if (post.value) {
  useSeo({
    title: `${post.value.title} — MyApp Blog`,
    description: post.value.excerpt,
    canonical: `/blog/${route.params.slug}`,
    ogType: 'article',
    ogImage: post.value.image,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.value.title,
      datePublished: post.value.date,
      image: post.value.image,
      author: { '@type': 'Organization', name: 'MyApp' },
    },
  })
}
</script>
```

### What this produces in the HTML (server-rendered)

For the homepage, the initial HTML response sent to Google/browsers contains:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyApp — The Best Solution for Your Needs</title>
  <meta name="description" content="MyApp helps teams collaborate, ship faster, and grow." />
  <meta property="og:title" content="MyApp — The Best Solution for Your Needs" />
  <meta property="og:description" content="MyApp helps teams collaborate, ship faster, and grow." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://myapp.com/images/og-home.png" />
  <meta property="og:url" content="https://myapp.com/" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="MyApp — The Best Solution for Your Needs" />
  <meta name="twitter:image" content="https://myapp.com/images/og-home.png" />
  <link rel="canonical" href="https://myapp.com/" />
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite",...}</script>
</head>
<body>
  <div id="app">
    <!-- Fully rendered HTML here — visible to crawlers immediately -->
    <main><h1>Welcome to MyApp</h1><p>The best solution for your needs.</p></main>
  </div>
</body>
</html>
```

For a SPA route like `/dashboard`, the response is a bare shell (no rendered content, no SEO tags, `X-Robots-Tag: noindex`).

---

## 6. Streaming SSR

For large SSR pages, streaming sends HTML in chunks as Vue renders, reducing Time to First Byte (TTFB).

```ts
// In server.ts — add a streaming variant
import { renderToWebStream } from 'vue/server-renderer'

export async function renderStream(url: string) {
  const rule = resolveRouteRule(url)
  if (rule.mode === 'spa') return null // Don't stream SPA pages

  const { app, router, head } = createApp({ isServer: true, url })
  await router.push(url)
  await router.isReady()

  const vueStream = renderToWebStream(app)
  const headPayload = await renderSSRHead(head)

  return { vueStream, head: headPayload, rule }
}
```

```ts
// In index.ts — streaming handler for SSR routes
import { stream } from 'hono/streaming'

app.get('/*', async (c) => {
  const url = new URL(c.req.url).pathname
  const rule = resolveRouteRule(url)

  // For SPA routes, use the non-streaming path as before
  if (rule.mode === 'spa') {
    // ... same as section 4
  }

  // For SSR routes, stream the response
  const { renderStream } = isProduction
    ? await import('./dist/server/server.js')
    : await import('./src/server.ts')

  const result = await renderStream(url)
  if (!result) { /* fallback to non-streaming */ }

  // Split template around <!--ssr-outlet-->
  const [beforeApp, afterApp] = templateHtml.split('<!--ssr-outlet-->')
  const headHtml = beforeApp.replace('<!--head-outlet-->', result.head.headTags)

  return stream(c, async (s) => {
    // Send <head> and opening <body> immediately
    await s.write(headHtml)

    // Stream Vue-rendered HTML in chunks
    const reader = result.vueStream.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      await s.write(typeof value === 'string' ? value : decoder.decode(value))
    }

    // Close the document
    await s.write(afterApp.replace('<!--state-outlet-->', ''))
  })
})
```

---

## 7. Pinia State Management with SSR

```ts
// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref<{ id: number; name: string } | null>(null)
  const isAuthenticated = ref(false)

  async function fetchUser() {
    const res = await fetch('/api/users/me')
    if (res.ok) {
      user.value = await res.json()
      isAuthenticated.value = true
    }
  }

  return { user, isAuthenticated, fetchUser }
})
```

The serialization/hydration loop:
1. **Server:** Pinia state is serialized → injected as `<script id="__pinia">` in HTML
2. **Client:** `app.ts` reads the JSON → sets `pinia.state.value` → Vue hydrates with correct state
3. **No double-fetch:** Data fetched during SSR is immediately available on the client

---

## 8. Build & Development

### Development

```bash
npm run dev
# Starts Vite + Hono dev server on http://localhost:5173
# Hot Module Replacement for Vue components
# API routes reload on change
```

### Production Build

```bash
npm run build
# Step 1: vite build --outDir dist/client
#   → dist/client/index.html (with hashed asset links)
#   → dist/client/assets/*.js, *.css
#
# Step 2: vite build --outDir dist/server --ssr src/server.ts
#   → dist/server/server.js (server render function)
```

### Production Run

```bash
npm run preview
# NODE_ENV=production node server-prod.js
```

### `server-prod.js` (production entry)

```js
import { serve } from '@hono/node-server'
import app from './dist/server/server.js'

serve({ fetch: app.fetch, port: Number(process.env.PORT) || 4000 }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
})
```

---

## 9. Deployment Targets

| Target | How |
|---|---|
| **Bun** (default) | `bun run dist/index.js` (zero changes, fastest cold start) |
| **Docker (Bun)** (default container) | Multi-stage `oven/bun` Dockerfile — see below |
| **Docker (Node)** | Multi-stage Node Dockerfile with `@hono/node-server` |
| **Node.js** | `@hono/node-server` — `node dist/index.js` |
| **Deno** | `deno run --allow-net --allow-read dist/index.js` |
| **Cloudflare Workers** | Replace `readFileSync` with inline template. Use `renderToWebStream`. No `fs`. |
| **Vercel** | Serverless function wrapping the Hono app |
| **PM2 (Bun / Node)** | `pm2 start ecosystem.config.js` — auto-generated config, cluster or fork mode (see [Section 22](#22-pm2-deployment--process-management)) |

### Default Dockerfile (Bun)

When targeting Docker, Vono generates a **Bun-based** multi-stage Dockerfile by default:

```dockerfile
# ─────────────────────────────────────────────
# Build stage
# ─────────────────────────────────────────────
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
COPY .env .env
RUN bun install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
RUN bun run build

# ─────────────────────────────────────────────
# Runtime stage
# ─────────────────────────────────────────────
FROM oven/bun:1 AS runtime
LABEL name="my-vono-app"
LABEL version="1.0.0"
WORKDIR /app

# Install runtime utilities (optional — only if redis/health checks needed)
RUN apt-get update && apt-get install -y redis-tools curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY .env .env

# Optional: wait-for-redis script (if queue/redis is enabled)
# COPY wait-for-redis.sh /usr/local/bin/wait-for-redis.sh
# RUN chmod +x /usr/local/bin/wait-for-redis.sh
# ENTRYPOINT ["/usr/local/bin/wait-for-redis.sh"]

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:4000/health || exit 1

CMD ["bun", "dist/index.js"]
```

**Key points:**
- Uses `oven/bun:1` for both build and runtime (smallest footprint)
- Multi-stage build keeps the final image small
- `HEALTHCHECK` hits the Vono health endpoint
- If Redis/queue is enabled, the CLI also generates a `wait-for-redis.sh` entrypoint script and a `docker-compose.yml`
- `.env` is copied in — for production, use Docker secrets or env injection instead

### Docker Compose (generated when queue/redis is enabled)

```yaml
services:
  app:
    build: .
    ports:
      - "${PORT:-4000}:4000"
    env_file: .env
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  redis_data:
```

---

## 10. SSR-Safe Coding Rules

| Rule | Why |
|---|---|
| **No `window`/`document`/`localStorage` in `setup()` or `<script setup>`** | These don't exist on the server. Use `onMounted()`. |
| **Use `onServerPrefetch()` for server data fetching** | Runs only on server, before `renderToString` completes. |
| **Use `import.meta.env.SSR` for conditional logic** | `true` on server, `false` on client. Tree-shaken at build time. |
| **Never share state across requests** | The `createApp()` factory creates a fresh instance per request. |
| **Avoid `setInterval`/`setTimeout` in setup** | They leak on the server. Use `onMounted()`. |
| **Check third-party lib SSR support** | Some libs import `window` at top level and crash SSR. Use dynamic `import()` inside `onMounted`. |
| **Use `data-allow-mismatch` for unavoidable mismatches** | Vue 3.5+: `<span data-allow-mismatch="text">{{ date }}</span>` |

### Client-Only Components

For components that must never run on the server:

```vue
<template>
  <ClientOnly>
    <HeavyChart :data="chartData" />
    <template #fallback>
      <div class="skeleton">Loading chart...</div>
    </template>
  </ClientOnly>
</template>
```

You'd implement `ClientOnly` as:

```vue
<!-- src/components/ClientOnly.vue -->
<template>
  <slot v-if="mounted" />
  <slot v-else name="fallback" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const mounted = ref(false)
onMounted(() => { mounted.value = true })
</script>
```

---

## 11. What You Lose vs Nuxt (And How to Replace It)

| Nuxt Feature | Status in Hono+Vue | Replacement |
|---|---|---|
| **File-based routing** | Built-in | Vue Router v5 file-based routing. `*.page.vue` files in modules become routes automatically. `definePage()` for per-page meta. |
| **`routeRules` hybrid rendering** | Implemented above | `src/route-rules.ts` — same concept, manual config. |
| **`useFetch()` / `useAsyncData()`** | Manual | `onServerPrefetch()` + `onMounted()` pattern (shown in BlogPost example). |
| **Auto-imports** | Manual | Use `unplugin-auto-import` Vite plugin if desired. |
| **`<Head>` / `useHead()`** | Implemented above | `@unhead/vue` — exact same library Nuxt uses internally. |
| **Middleware** | Manual | Hono middleware for API, Vue Router `beforeEach` for pages. |
| **`<ClientOnly>`** | Implemented above | Simple component (shown above). |
| **Nitro server engine** | Replaced by Hono | Hono is the server. API routes in `src/api/`. |
| **Modules/plugins ecosystem** | Not available | Must integrate libraries manually. |
| **Dev tools** | Partial | Vue DevTools works. No Nuxt DevTools. |

---

## SEO Checklist

Everything below is handled by this architecture:

- [x] Server-rendered HTML for public pages (Google sees full content)
- [x] `<title>` and `<meta name="description">` per page
- [x] Open Graph tags (og:title, og:description, og:image, og:url)
- [x] Twitter Card tags
- [x] Canonical URLs (`<link rel="canonical">`)
- [x] JSON-LD structured data (WebSite, BlogPosting, Product, etc.)
- [x] Dynamic `robots.txt` (blocks /dashboard, /admin, /api)
- [x] XML sitemap at `/sitemap.xml`
- [x] `Cache-Control` headers with SWR for SSR'd pages
- [x] `X-Robots-Tag: noindex` header for SPA-only pages
- [x] Streaming SSR for fast TTFB
- [x] Proper hydration (no content flash, no mismatch)
- [x] Hashed static assets with immutable cache headers
- [x] SPA-only routes skip SSR entirely (saves server CPU)

---

## 12. Hono Production API Architecture

Everything below is extracted from the **WazobiaMail SaaS** codebase — a production Hono.js API running on Cloudflare Workers with PostgreSQL via Hyperdrive. This documents the modular monolith pattern, authentication system, middleware stack, API playground setup, auto-imports, and every bootstrapping concern you need to replicate it.

---

### 12.1 Modular Monolith — File Organization

One Hono app. Feature modules live in `src/modules/`. Each module is a self-contained folder with 4 files:

```
server/
├── src/
│   ├── index.ts                  # App entry — outer app + inner API router
│   ├── openapi.ts                # OpenAPI 3.1 spec object
│   ├── db/
│   │   ├── index.ts              # createDb() — Drizzle + pg Client
│   │   ├── schema.ts             # All Drizzle table definitions
│   │   ├── seed_plans.ts         # Seed scripts
│   │   └── seed_roles.ts
│   ├── lib/
│   │   ├── auth.ts               # JWT sign/verify, PBKDF2 password hashing, OTP
│   │   ├── country-lookup.ts
│   │   ├── totp.ts
│   │   └── ua-parser.ts
│   ├── shared/
│   │   ├── dto/
│   │   │   └── query.dto.ts      # Shared pagination/filter Zod schema
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts       # JWT auth + role guards
│   │   │   ├── apikey.middleware.ts     # API key auth (vono_* tokens)
│   │   │   ├── configProvider.ts        # Reads env vars → c.var.config
│   │   │   ├── dbProvider.ts            # Creates Drizzle client → c.var.db
│   │   │   ├── rateLimiter.ts           # Rate limiting (lazy init for CF Workers)
│   │   │   └── validator.ts             # Zod validator wrapper (422 format)
│   │   └── utils/
│   │       ├── id.ts                    # generateId() — crypto.randomUUID()
│   │       ├── pagination.ts            # buildPaginationMeta()
│   │       ├── response.ts              # success() / error() envelope helpers
│   │       ├── softDeletes.ts           # withSoftDeletes(), onlyTrashed()
│   │       └── autoRoutes.ts            # Auto-discovers & mounts *.routes.ts
│   ├── types/
│   │   └── index.ts              # AuthAccount, Env, Config, AppVariables, Roles
│   └── modules/
│       ├── auth/                 # ← Each module follows this pattern:
│       │   ├── auth.routes.ts    #    Routes (Hono sub-app)
│       │   ├── auth.controller.ts#    Controller (HTTP → Service)
│       │   ├── auth.service.ts   #    Service (business logic + DB)
│       │   └── auth.dto.ts       #    DTOs (Zod schemas + types)
│       ├── account/
│       ├── admin/
│       ├── audit-logs/
│       ├── payment/
│       ├── webhooks/
│       ├── notifications/
│       ├── ...                  #    (your feature modules here)
│       └── support/
├── drizzle/                      # Migration files
├── drizzle.config.ts
├── wrangler.jsonc
├── set-secrets.sh
├── tsconfig.json
└── package.json
```

**The 4-file module pattern:**

| File | Responsibility |
|---|---|
| `*.routes.ts` | Hono sub-app (`export default routes`). Auto-mounted by `autoRegisterRoutes()` at `/{moduleName}` |
| `*.controller.ts` | Parses request (body, params, query). Validates with Zod. Calls service. Returns `c.json()` |
| `*.service.ts` | Pure business logic + database queries. No HTTP concerns. Receives Drizzle `db` instance |
| `*.dto.ts` | Zod schemas for validation + TypeScript types via `z.infer<>` |

---

### 12.2 App Entry — Two-Layer Hono Setup

The app uses an **outer app** (cross-cutting concerns) and an **inner API router** (feature modules with DB access):

```ts
// src/index.ts
import { Hono } from "hono"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { swaggerUI } from "@hono/swagger-ui"
import { createFiberplane } from "@fiberplane/hono"

import type { AppVariables, Env } from "./types"
import { configProvider } from "./shared/middleware/configProvider"
import { dbProvider } from "./shared/middleware/dbProvider"
import { openApiSpec } from "./openapi"
import { autoRegisterRoutes } from "./shared/utils/autoRoutes"

// ═══════════════════════════════════════════════════════════════════════
//  OUTER APP — cross-cutting concerns (no DB access yet)
// ═══════════════════════════════════════════════════════════════════════

const app = new Hono<{ Variables: AppVariables; Bindings: Env }>()

app.use(logger())           // Logs every request method + path + status + timing
app.use(prettyJSON())       // Pretty-prints JSON when ?pretty is in the query
app.use(
  cors({
    credentials: true,
    origin: (origin, c) => {
      const env = (c.env as Record<string, string | undefined>) ?? {}
      const raw = env.ALLOWED_ORIGINS ?? process.env?.ALLOWED_ORIGINS ?? ""
      const allowedOrigins = raw
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
)

// Root info endpoint (health check / discovery)
app.get("/", (c) =>
  c.json({
    name: "My App API",
    version: "1.0.0",
    status: "operational",
    docs: "/docs",
  }),
)

// ═══════════════════════════════════════════════════════════════════════
//  INNER API ROUTER — all features go through config + DB middleware
// ═══════════════════════════════════════════════════════════════════════

const api = new Hono<{ Variables: AppVariables; Bindings: Env }>()

api.use("*", configProvider)   // Reads env vars → c.var.config
api.use("*", dbProvider)       // Creates Drizzle client → c.var.db

// ── Auto-mount all feature modules ─────────────────────────────────
// Discovers src/modules/*//*.routes.ts → mounts at /{moduleName}
await autoRegisterRoutes(api)

// ═══════════════════════════════════════════════════════════════════════
//  MOUNT API + DOCS
// ═══════════════════════════════════════════════════════════════════════

app.route("/api/v1", api)                          // All features under /api/v1
app.get("/openapi.json", (c) => c.json(openApiSpec))  // OpenAPI spec endpoint
app.get("/docs", swaggerUI({ url: "/openapi.json" })) // Swagger UI at /docs
app.use("/fp/*", createFiberplane({                    // Fiberplane at /fp
  openapi: { url: "/openapi.json" },
}))

// ═══════════════════════════════════════════════════════════════════════
//  ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.message }, err.status)
  }
  console.error("[Unhandled Error]", err)
  return c.json({ success: false, message: "Internal server error" }, 500)
})

app.notFound((c) =>
  c.json({ success: false, message: "The page you're looking for doesn't exist" }, 404),
)

export default app
```

**Why two layers?** The outer app handles CORS, logging, and docs endpoints — things that don't need a database. The inner API router applies `configProvider` and `dbProvider` once, and every feature module inherits them via `c.var.config` and `c.var.db`.

---

### 12.3 Type System — AppVariables, Env, Config

The type system defines what lives on `c.var` and `c.env`:

```ts
// src/types/index.ts
import type { DrizzleDb } from "../db"

export interface AuthAccount {
  id: number
  email: string
  username: string
  currentRole: string
  roles: string[]
  status: number
  language: string
}

// Cloudflare Worker bindings (c.env)
export interface Env {
  HYPERDRIVE: Hyperdrive
  DATABASE_URL: string
  JWT_SECRET: string
  CLIENT_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  RESEND_API_KEY: string
  PAYSTACK_PUBLIC_KEY: string
  PAYSTACK_SECRET_KEY: string
  PAYSTACK_WEBHOOK_SECRET: string
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  PAYMENT_CREDS_ENCRYPTION_KEY: string
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_ZONE_NAME: string
  NODE_ENV: string
}

// Validated config (c.var.config) — same keys, but guaranteed present
export interface Config {
  JWT_SECRET: string
  CLIENT_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  RESEND_API_KEY: string
  PAYSTACK_PUBLIC_KEY: string
  PAYSTACK_SECRET_KEY: string
  PAYSTACK_WEBHOOK_SECRET: string
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  PAYMENT_CREDS_ENCRYPTION_KEY: string
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_ZONE_NAME: string
  NODE_ENV: string
}

// What lives on c.var
export interface AppVariables {
  config: Config
  db: DrizzleDb
  account: AuthAccount
  [key: string]: any   // Allow modules to set custom vars
}

export const ROLES = ["user", "admin", "superadmin", "staff", "customer_care"] as const
export type Role = (typeof ROLES)[number]
```

Every Hono sub-app is typed as `new Hono<{ Variables: AppVariables; Bindings: Env }>()` — this gives full autocomplete on `c.var.config`, `c.var.db`, `c.var.account`, and `c.env.HYPERDRIVE`.

---

### 12.4 Middleware Stack

The app uses 7 middleware types. Here's each one:

#### a) Config Provider — reads env vars into `c.var.config`

```ts
// src/shared/middleware/configProvider.ts
import { createMiddleware } from "hono/factory"
import type { Config, AppVariables } from "../../types"

export const configProvider = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const env = (c.env as Record<string, string | undefined>) ?? {}

  function get(key: string): string {
    const value = env[key] ?? (typeof process !== "undefined" ? process.env[key] : undefined)
    if (!value) throw new Error(`Missing required env var: ${key}`)
    return value
  }

  function getOptional(key: string): string {
    return env[key] ?? (typeof process !== "undefined" ? (process.env[key] ?? "") : "") ?? ""
  }

  const config: Config = {
    JWT_SECRET: get("JWT_SECRET"),
    CLIENT_URL: getOptional("CLIENT_URL"),
    GOOGLE_CLIENT_ID: getOptional("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: getOptional("GOOGLE_CLIENT_SECRET"),
    GITHUB_CLIENT_ID: getOptional("GITHUB_CLIENT_ID"),
    GITHUB_CLIENT_SECRET: getOptional("GITHUB_CLIENT_SECRET"),
    RESEND_API_KEY: getOptional("RESEND_API_KEY"),
    // ... all other env vars
    NODE_ENV: getOptional("NODE_ENV") || "development",
  }

  c.set("config", config)
  await next()
})
```

**Why?** Cloudflare Workers use `c.env` bindings (not `process.env`). This middleware normalizes both environments and guarantees required vars are present.

#### b) DB Provider — per-request Drizzle client via Hyperdrive

```ts
// src/shared/middleware/dbProvider.ts
import { createMiddleware } from "hono/factory"
import { createDb } from "../../db"
import type { AppVariables, Env } from "../../types"

export const dbProvider = createMiddleware<{ Variables: AppVariables; Bindings: Env }>(
  async (c, next) => {
    const { db, client } = await createDb(c.env.HYPERDRIVE.connectionString)
    c.set("db", db)
    try {
      await next()
    } finally {
      await client.end().catch(() => {})
    }
  },
)
```

```ts
// src/db/index.ts
import { Client } from "pg"
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import * as schema from "./schema"

export type DrizzleDb = NodePgDatabase<typeof schema>

export async function createDb(connectionString: string) {
  const client = new Client({ connectionString })
  await client.connect()
  const db = drizzle(client, { schema })
  return { db, client }
}
```

**Connection lifecycle:** Client is created per request, used through the handler, and closed in `finally`. Hyperdrive manages the actual connection pool — per-request client creation is fast.

#### c) Auth Middleware — JWT verification + role loading

```ts
// src/shared/middleware/auth.middleware.ts
import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import { eq } from "drizzle-orm"
import * as schema from "../../db/schema"
import { verifyToken } from "../../lib/auth"
import type { AuthAccount, AppVariables } from "../../types"

// ── Standard auth: requires valid JWT ──────────────────────────────
export const authMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const config = c.get("config")
  const db = c.get("db")

  const authHeader = c.req.header("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Please sign in to continue" })
  }

  const token = authHeader.slice(7)
  const payload = await verifyToken(token, config.JWT_SECRET)
  if (!payload?.accountId) {
    throw new HTTPException(401, { message: "Your session has expired. Please sign in again" })
  }

  // Confirm account still exists and is active
  const [dbAccount] = await db
    .select().from(schema.account)
    .where(eq(schema.account.accountId, payload.accountId)).limit(1)

  if (!dbAccount || dbAccount.status !== 1) {
    throw new HTTPException(401, { message: "Your account is not available" })
  }

  // Load roles from junction table
  const roleRows = await db
    .select({ name: schema.role.roleName })
    .from(schema.accountRole)
    .innerJoin(schema.role, eq(schema.accountRole.roleId, schema.role.roleId))
    .where(eq(schema.accountRole.accountId, dbAccount.accountId))

  const roles = roleRows.map((r) => r.name)

  c.set("account", {
    id: dbAccount.accountId,
    email: dbAccount.email,
    username: dbAccount.username,
    currentRole: roles[0] ?? "user",
    roles,
    status: dbAccount.status,
    language: dbAccount.language,
  })

  await next()
})

// ── Optional auth: continues as guest if no token ──────────────────
export const optionalAuthMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")
  if (!authHeader?.startsWith("Bearer ")) { await next(); return }

  try {
    // Same logic as authMiddleware, but wrapped in try/catch
    // On failure → silently continue as guest
    const config = c.get("config")
    const db = c.get("db")
    const token = authHeader.slice(7)
    const payload = await verifyToken(token, config.JWT_SECRET)
    if (!payload?.accountId) { await next(); return }

    const [dbAccount] = await db
      .select().from(schema.account)
      .where(eq(schema.account.accountId, payload.accountId)).limit(1)

    if (!dbAccount || dbAccount.status !== 1) { await next(); return }

    // ... load roles, set c.var.account (same as authMiddleware)
  } catch {
    // Token invalid — continue as guest
  }
  await next()
})

// ── Role guards: stack after authMiddleware ─────────────────────────
export const isAdmin = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const account = c.get("account")
  if (!account) throw new HTTPException(401, { message: "Unauthorized" })
  if (!account.roles.includes("admin") && !account.roles.includes("superadmin")) {
    throw new HTTPException(403, { message: "Forbidden: admin access required" })
  }
  await next()
})

export const isSuperAdmin = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const account = c.get("account")
  if (!account) throw new HTTPException(401, { message: "Unauthorized" })
  if (!account.roles.includes("superadmin")) {
    throw new HTTPException(403, { message: "Forbidden: superadmin access required" })
  }
  await next()
})
```

#### d) API Key Middleware — dual auth (JWT or API key)

```ts
// src/shared/middleware/apikey.middleware.ts
import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"

// Extracts API key from X-API-Key header or Bearer wzbm_... token
export function extractApiKey(c: { req: { header: (name: string) => string | undefined } }): string | null {
  const xApiKey = c.req.header("X-API-Key")
  if (xApiKey?.startsWith("wzbm_")) return xApiKey
  const authHeader = c.req.header("Authorization")
  if (authHeader?.startsWith("Bearer wzbm_")) return authHeader.slice(7)
  return null
}

// Accepts EITHER JWT or API key — route works for both user dashboard and programmatic access
export const apiKeyOrJwtMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const apiKey = extractApiKey(c)
  if (!apiKey) { await next(); return }  // No API key → fall through to JWT auth

  const db = c.get("db")
  const service = new ApiKeysService(db)
  const keyRecord = await service.getByApiKey(apiKey)

  if (!keyRecord?.accountId) {
    throw new HTTPException(401, { message: "The API key provided is invalid" })
  }

  // Load account + roles (same pattern as authMiddleware)
  // Set c.var.account so downstream handlers work identically
  // ...
  await next()
})
```

#### e) Rate Limiter — lazy init for CF Workers

```ts
// src/shared/middleware/rateLimiter.ts
import { rateLimiter } from "hono-rate-limiter"
import type { Context, Next } from "hono"

type RateLimiterMiddleware = (c: Context, next: Next) => Promise<Response | void>

// Lazy init pattern — avoids setInterval in global scope (CF Workers forbids it)
let _authRateLimiter: RateLimiterMiddleware | null = null

function getAuthRateLimiter(): RateLimiterMiddleware {
  if (!_authRateLimiter) {
    _authRateLimiter = rateLimiter({
      windowMs: 5 * 60 * 1000,  // 5 minutes
      limit: 5,                  // 5 requests per window
      standardHeaders: "draft-6",
      keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "global",
      handler: (c) => c.json({ success: false, statusCode: 429,
        message: "Too many attempts, please try again after 5 minutes." }, 429),
    })
  }
  return _authRateLimiter
}

export const authRateLimiter = (c: Context, next: Next) => getAuthRateLimiter()(c, next)

// Stricter: 3 OTP requests per 10 minutes
let _otpRateLimiter: RateLimiterMiddleware | null = null
// ... same pattern with { windowMs: 10 * 60 * 1000, limit: 3 }
export const otpRateLimiter = (c: Context, next: Next) => getOtpRateLimiter()(c, next)
```

#### f) Zod Validator — consistent 422 error format

```ts
// src/shared/middleware/validator.ts
import { zValidator as honoZValidator } from "@hono/zod-validator"
import type { ZodSchema } from "zod"

export function zodValidator<T extends ZodSchema>(
  target: "json" | "query" | "param" | "form" | "header",
  schema: T,
) {
  return honoZValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[issue.path.join(".")] = issue.message
      }
      return c.json({ success: false, message: "Validation failed", errors }, 422)
    }
  })
}
```

**Middleware application order per request:**

```
Request
  → logger()           (outer app)
  → prettyJSON()       (outer app)
  → cors()             (outer app)
  → configProvider     (inner API — reads env vars)
  → dbProvider         (inner API — creates DB client)
  → authMiddleware     (per-module or per-route)
  → isAdmin            (optional, stacked after auth)
  → rateLimiter        (per-route, e.g. login)
  → zodValidator       (per-route, inline)
  → Controller → Service → DB
  → finally: client.end()
```

---

### 12.5 Module Pattern — Routes → Controller → Service → DTO

Every module follows the same 4-file pattern. Here's `plans` as the canonical example:

#### Routes — Hono sub-app with middleware

```ts
// src/modules/plans/plans.routes.ts
import { Hono } from "hono"
import type { AppVariables } from "../../types"
import { authMiddleware, isAdmin } from "../../shared/middleware/auth.middleware"
import { PlansService } from "./plans.service"
import { PlansController } from "./plans.controller"

const plansRoutes = new Hono<{ Variables: AppVariables }>()

// Apply auth to all plan routes
plansRoutes.use("*", authMiddleware)

// Inject service + controller per request
plansRoutes.use("*", async (c, next) => {
  const service = new PlansService(c.get("db"))
  c.set("plansController", new PlansController(service))
  await next()
})

// User routes
plansRoutes.get("/", (c) => (c.get("plansController") as PlansController).list(c))
plansRoutes.get("/:id", (c) => (c.get("plansController") as PlansController).getById(c))

// Admin only — isAdmin stacked after authMiddleware
plansRoutes.post("/", isAdmin, (c) => (c.get("plansController") as PlansController).create(c))
plansRoutes.put("/:id", isAdmin, (c) => (c.get("plansController") as PlansController).update(c))
plansRoutes.delete("/:id", isAdmin, (c) => (c.get("plansController") as PlansController).remove(c))

export { plansRoutes }
```

#### Controller — HTTP → Service bridge

```ts
// src/modules/plans/plans.controller.ts
import type { Context } from "hono"
import type { AppVariables } from "../../types"
import { success, error } from "../../shared/utils/response"
import type { PlansService } from "./plans.service"

type AppContext = Context<{ Variables: AppVariables }>

export class PlansController {
  constructor(private service: PlansService) {}

  async list(c: AppContext) {
    const plans = await this.service.list()
    return c.json(success("Plans loaded", plans))
  }

  async getById(c: AppContext) {
    const { id } = c.req.param()
    const plan = await this.service.getById(id)
    if (!plan) return c.json(error("Plan not found"), 404)
    return c.json(success("Plan loaded", plan))
  }

  async create(c: AppContext) {
    const body = await c.req.json()
    if (!body.name) return c.json(error("A plan name is required"), 422)
    const plan = await this.service.create(body)
    return c.json(success("Plan created", plan), 201)
  }

  async update(c: AppContext) {
    const { id } = c.req.param()
    const body = await c.req.json()
    const plan = await this.service.update(id, body)
    if (!plan) return c.json(error("Plan not found"), 404)
    return c.json(success("Plan updated", plan))
  }

  async remove(c: AppContext) {
    const { id } = c.req.param()
    const deleted = await this.service.softDelete(id)
    if (!deleted) return c.json(error("Plan not found"), 404)
    return c.json(success("Plan deleted", deleted))
  }
}
```

#### Service — business logic + DB queries

```ts
// src/modules/plans/plans.service.ts
import { eq, and, isNull, desc } from "drizzle-orm"
import type { DrizzleDb } from "../../db"
import * as schema from "../../db/schema"
import { generateId } from "../../shared/utils/id"

export class PlansService {
  constructor(private db: DrizzleDb) {}

  async list() {
    return this.db
      .select().from(schema.plans)
      .where(isNull(schema.plans.deletedAt))
      .orderBy(desc(schema.plans.createdAt))
  }

  async getById(id: string) {
    const [plan] = await this.db
      .select().from(schema.plans)
      .where(and(eq(schema.plans.id, id), isNull(schema.plans.deletedAt)))
      .limit(1)
    return plan ?? null
  }

  async create(data: { name: string; usdPrice?: string; /* ... */ }) {
    const id = `plan_${generateId()}`
    const [plan] = await this.db
      .insert(schema.plans).values({ id, ...data }).returning()
    return plan
  }

  async softDelete(id: string) {
    const [plan] = await this.db
      .update(schema.plans)
      .set({ deletedAt: new Date().toISOString(), status: "deleted" })
      .where(and(eq(schema.plans.id, id), isNull(schema.plans.deletedAt)))
      .returning({ id: schema.plans.id })
    return plan ?? null
  }
}
```

#### DTO — Zod schemas + types

```ts
// src/modules/auth/auth.dto.ts
import { z } from "zod"

export const SignupSchema = z.object({
  username: z.string().min(3).max(64).optional(),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  planId: z.string().max(64).optional(),
})
export type SignupInput = z.infer<typeof SignupSchema>

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof LoginSchema>

// Shared query DTO (reused across all list endpoints):
// src/shared/dto/query.dto.ts
export const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
  q: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  category: z.string().optional(),
  fields: z.string().optional(),
})
```

---

### 12.6 Authentication — Full Flow

#### JWT Token System

Uses Hono's built-in JWT (`hono/jwt`) — zero extra dependencies:

```ts
// src/lib/auth.ts
import { sign, verify } from "hono/jwt"

const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60         // 15 minutes
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 3600  // 7 days

export async function signAccessToken(
  payload: { accountId: number; email: string; username: string },
  secret: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return sign({ ...payload, sub: String(payload.accountId), iat: now,
    exp: now + ACCESS_TOKEN_EXPIRY_SECONDS, type: "access" }, secret)
}

export async function signRefreshToken(
  payload: { accountId: number; email: string; username: string },
  secret: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return sign({ ...payload, sub: String(payload.accountId), iat: now,
    exp: now + REFRESH_TOKEN_EXPIRY_SECONDS, type: "refresh" }, secret)
}

export async function verifyToken(token: string, secret: string) {
  try { return await verify(token, secret, "HS256") as TokenPayload }
  catch { return null }
}
```

#### Password Hashing — PBKDF2 via Web Crypto (CF Workers compatible)

```ts
// No bcrypt. No argon2. Pure Web Crypto API — runs everywhere.
const PBKDF2_ITERATIONS = 100_000
const SALT_LENGTH = 16
const KEY_LENGTH = 32

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"],
  )
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial, KEY_LENGTH * 8,
  )
  return `${bufferToHex(salt)}:${bufferToHex(new Uint8Array(hashBuffer))}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":")
  // ... recompute PBKDF2 with same salt, compare with timing-safe equal
  return timingSafeEqual(computedHex, hashHex)
}
```

#### OAuth — Google and GitHub

OAuth flows are handled entirely in the auth controller. The pattern:

1. **Redirect endpoint** (`GET /auth/google`) — builds OAuth URL with `redirect_uri` pointing to the **server** callback, not the frontend
2. **Callback endpoint** (`GET /auth/google/callback`) — exchanges code for tokens, fetches user info, calls `findOrCreateOAuthAccount()`
3. **Account linking** — if email already exists, link the OAuth provider. If new, create account + assign default role + free plan
4. **Frontend redirect** — callback redirects to `CLIENT_URL/auth/callback?accessToken=...&refreshToken=...`

```ts
// Google redirect
async googleRedirect(c: AppContext) {
  const config = c.get("config")
  const serverBase = this.getServerBaseUrl(c)  // https://api.example.com
  const redirectUri = `${serverBase}/api/v1/auth/google/callback`

  const params = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: crypto.randomUUID(),
    access_type: "offline",
    prompt: "consent",
  })
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}

// Google callback
async googleCallback(c: AppContext) {
  const code = c.req.query("code")
  // Exchange code → tokens
  const tokenData = await fetch("https://oauth2.googleapis.com/token", { ... })
  // Fetch user info
  const userData = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { ... })
  // Find or create account
  const result = await this.service.findOrCreateOAuthAccount(
    "google", userData.id, userData.email, userData.name, ...
  )
  // Redirect to frontend with tokens
  return c.redirect(`${config.CLIENT_URL}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`)
}

// GitHub follows the same pattern with:
// - https://github.com/login/oauth/authorize
// - https://github.com/login/oauth/access_token
// - https://api.github.com/user + /user/emails
```

#### Session Management

Refresh tokens are stored as SHA-256 hashes in an `auth_session` table:

```
auth_session:
  id, accountId, tokenHash, ip, userAgent, country, city, expiresAt, createdAt
```

- `POST /auth/refresh` — exchanges refresh token hash → new access + refresh pair, deletes old session
- `GET /auth/sessions` — lists all active sessions for the current user
- `DELETE /auth/sessions/:id` — revokes a specific session
- `POST /auth/sessions/revoke-all` — revokes all sessions except the current one

#### Password Reset via OTP

- `POST /auth/forgot-password` — generates 6-digit OTP, stores in `verification_code` table, emails via Resend
- `POST /auth/reset-password` — verifies OTP + resets password + invalidates all sessions
- **DB-based rate limiting:** max 3 OTPs per 10 minutes, 5-minute cooldown between requests

---

### 12.7 Swagger UI & Fiberplane

#### Swagger UI at `/docs`

```ts
import { swaggerUI } from "@hono/swagger-ui"
app.get("/openapi.json", (c) => c.json(openApiSpec))
app.get("/docs", swaggerUI({ url: "/openapi.json" }))
```

The `openApiSpec` is a hand-written OpenAPI 3.1 object in `src/openapi.ts` with tags, security schemes, and schema components:

```ts
export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "WazobiaMail SaaS API",
    version: "1.0.0",
    description: "Email SaaS platform API...",
  },
  servers: [
    { url: "http://localhost:8787", description: "Local dev" },
    { url: "https://api.wazobiamail.app", description: "Production" },
  ],
  tags: [
    { name: "Auth", description: "Authentication & profile" },
    { name: "Plans", description: "Subscription plans" },
    { name: "Payments", description: "Payment processing" },
    // ... all module tags
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      SuccessResponse: { /* ... */ },
      ErrorResponse: { /* ... */ },
      PaginationMeta: { /* ... */ },
      SignupInput: { /* ... */ },
      LoginInput: { /* ... */ },
    },
  },
}
```

#### Fiberplane at `/fp`

Fiberplane provides an interactive API playground (like Postman in the browser):

```ts
import { createFiberplane } from "@fiberplane/hono"

app.use("/fp/*", createFiberplane({
  openapi: { url: "/openapi.json" },
}))
```

Access at `http://localhost:8787/fp` during development. It auto-discovers endpoints from the OpenAPI spec.

---

### 12.8 Response Envelope & Utilities

#### Standard response envelope

Every endpoint returns a consistent JSON shape via the `ApiResponse` class. Simple `success()` / `error()` helper functions are also exported as convenient aliases.

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  API Response — Uniform JSON envelope
 *  Path:  src/shared/utils/response.ts
 * ──────────────────────────────────────────────────────────────
 *  Every API endpoint returns { success, message, data? | errors? }.
 *  Use ApiResponse.success() / ApiResponse.failure() in controllers.
 *  The loose helpers success() / error() are aliases for quick usage.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/shared/utils/response.ts

// ─── Type ──────────────────────────────────────────────────
export interface ApiResponseBody<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string> | string[]
}

// ─── Class — the primary pattern ───────────────────────────
export class ApiResponse {
  /**
   * Return a successful JSON response.
   * @example return c.json(ApiResponse.success(plans, 'Plans loaded'))
   */
  static success<T>(data: T, message = 'Success'): ApiResponseBody<T> {
    return { success: true, message, data }
  }

  /**
   * Return a failure JSON response.
   * @example return c.json(ApiResponse.failure('Not found'), 404)
   */
  static failure(
    message = 'Something went wrong',
    errors?: Record<string, string> | string[],
  ): ApiResponseBody<null> {
    return {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    }
  }
}

// ─── Convenience aliases (these mirror the class above) ────
export function success<T>(message: string, data: T): ApiResponseBody<T> {
  return ApiResponse.success(data, message)
}

export function error(message: string, errors?: Record<string, string>): ApiResponseBody<null> {
  return ApiResponse.failure(message, errors)
}
```

#### Usage — both styles work

```ts
// Style 1: Class methods (recommended — explicit, IDE-friendly)
return c.json(ApiResponse.success(plans, 'Plans loaded'))         // 200
return c.json(ApiResponse.success(plan, 'Plan created'), 201)     // 201
return c.json(ApiResponse.failure('Plan not found'), 404)         // 404
return c.json(ApiResponse.failure('Validation failed', fieldErrors), 422)

// Style 2: Loose helpers (shorter — great for simple cases)
return c.json(success('Plans loaded', plans))           // 200
return c.json(success('Plan created', plan), 201)       // 201
return c.json(error('Plan not found'), 404)              // 404
return c.json(error('Validation failed', fieldErrors), 422)
```

#### Consistent JSON shape (both styles produce the same output)

```json
// Success
{ "success": true,  "message": "Plans loaded", "data": [ ... ] }

// Failure
{ "success": false, "message": "Validation failed", "errors": { "email": "Required" } }

// Failure with array errors
{ "success": false, "message": "Multiple errors", "errors": ["Field A invalid", "Field B missing"] }
```

#### Pagination helper

```ts
// src/shared/utils/pagination.ts
export function buildPaginationMeta(opts: { page: number; limit: number; total: number }) {
  const totalPages = Math.ceil(opts.total / opts.limit)
  return {
    page: opts.page,
    page_size: opts.limit,
    total_items: opts.total,
    total_pages: totalPages,
    has_next: opts.page < totalPages,
    has_prev: opts.page > 1,
  }
}
```

#### Soft deletes

```ts
// src/shared/utils/softDeletes.ts
import { isNull, isNotNull } from "drizzle-orm"

export function withSoftDeletes(table: any) {
  return table?.deletedAt ? isNull(table.deletedAt) : undefined
}
export function onlyTrashed(table: any) {
  return table?.deletedAt ? isNotNull(table.deletedAt) : undefined
}
export function withTrashed() { return undefined }  // No filter
```

#### ID generation

```ts
export function generateId(): string {
  return crypto.randomUUID()
}
```

---

### 12.9 Route Patterns — Auth Placement

Different modules need different auth strategies. Here are the patterns used:

#### Pattern 1: All routes require auth

```ts
// plans, domains, mailboxes, etc.
const routes = new Hono<{ Variables: AppVariables }>()
routes.use("*", authMiddleware)  // Everything requires login
routes.get("/", handler)
```

#### Pattern 2: Public routes before auth, protected after

```ts
// auth module — signup/login are public, /me and /sessions are protected
authRoutes.post("/signup", ctrl.signup)              // No auth
authRoutes.post("/login", authRateLimiter, ctrl.login)  // No auth + rate limiting
authRoutes.use("/me", authMiddleware)                // Auth required from here
authRoutes.get("/me", ctrl.getMe)
```

#### Pattern 3: Webhook before auth

```ts
// payment module — Paystack webhook has NO auth (verified by HMAC signature)
paymentRoutes.post("/webhook/paystack", ctrl.paystackWebhook)  // Before auth!
paymentRoutes.use("*", authMiddleware)  // Auth applied to everything else
paymentRoutes.post("/initiate", ctrl.initiate)
```

#### Pattern 4: Optional auth (guest + authenticated)

```ts
// support module — guests can submit tickets, auth users get accountId stamped
supportRoutes.post("/", optionalAuthMiddleware, ctrl.create)
supportRoutes.get("/my", authMiddleware, ctrl.list)        // Auth required
supportRoutes.use("/admin/*", authMiddleware, isAdmin)     // Auth + admin required
```

#### Pattern 5: Admin namespace

```ts
// Admin routes use middleware stacking
routes.use("/admin/*", authMiddleware, isAdmin)
routes.get("/admin/tickets", ctrl.adminList)
routes.get("/admin/metrics", ctrl.adminMetrics)
```

---

---

## 13. Vono CLI — Installation Wizard

The `create-vono` CLI scaffolds everything interactively. Always fetches the **latest** version of every dependency at install time (no pinned versions in the template — `@latest` everywhere).

```bash
# Default (bun):
bun create vono@latest my-app

# Or with any package manager:
npx create-vono@latest my-app
pnpm create vono@latest my-app
yarn create vono my-app
```

### 13.1 Interactive Prompts

The installer walks through every decision:

Prompts are ordered by **importance** — foundational decisions first, optional features last:

```
🔥 create-vono v1.0.0

┌  Welcome to Vono — The Hono + Vue Framework
│
◆  Project name: my-app
│
◆  Language?
│  ● TypeScript (recommended)
│  ○ JavaScript
│
◆  What are you building?
│  ● Full-stack (API + Vue frontend)
│  ○ API only
│
◆  Package manager?
│  ● bun (default)
│  ○ pnpm
│  ○ yarn
│  ○ npm
│
◆  Deployment target?
│  ● Bun
│  ○ Cloudflare Workers
│  ○ Cloudflare Pages
│  ○ Node.js
│  ○ Deno
│  ○ AWS Lambda
│  ○ Vercel
│  ○ Netlify
│  ○ Fastly
│  ○ Docker (Bun)
│  ○ Docker (Node)
│
◆  Database?
│  ● PostgreSQL (pg)
│  ○ PostgreSQL (Neon serverless)
│  ○ PostgreSQL (Supabase)
│  ○ PostgreSQL (Xata)
│  ○ MySQL (mysql2)
│  ○ PlanetScale (MySQL)
│  ○ SQLite (better-sqlite3)
│  ○ SQLite (Bun built-in)
│  ○ Turso / libSQL
│  ○ Cloudflare D1
│  ○ None (add later)
│
◆  Queue driver? (auto-detected from runtime)
│  ● Auto (recommended)
│  ○ BullMQ + Redis (Bun / Node)
│  ○ Cloudflare Queues (CF only)
│  ○ AWS SQS (Lambda only)
│  ○ Upstash QStash (any runtime)
│  ○ Sync (in-process, dev only)
│  ○ None
│
◆  Cache driver?
│  ● Upstash (works everywhere)
│  ○ Cloudflare KV (CF only)
│  ○ Redis (Bun / Node / Docker)
│  ○ In-memory (dev only)
│  ○ None
│
◆  Email provider?
│  ● Resend
│  ○ SMTP (nodemailer)
│  ○ AWS SES
│  ○ WazobiaMail (coming soon)
│  ○ Custom (bring your own)
│  ○ None (add later)
│
◆  File storage?
│  ● Local / disk (default)
│  ○ Cloudflare R2
│  ○ Cloudinary
│  ○ AWS S3
│  ○ Bunny.net Storage
│  ○ None (add later)
│
◆  Real-time / WebSocket?
│  ● None (add later)
│  ○ Hono WebSocket (built-in — works on all runtimes)
│  ○ Socket.IO (Bun / Node only — richer API, rooms, namespaces)
│
◆  Notifications?
│  ● Yes — in-app notifications (table + API + page)
│  ○ No (add later with `vono add notifications`)
│
◆  Logging / Audit trail?
│  ● Yes — activity logging (queue-backed when available)
│  ○ No (add later with `vono add logging`)
│
◆  Auth scaffolding?
│  ● Email + Password (default)
│  ○ Email + Password + Google OAuth
│  ○ Email + Password + GitHub OAuth
│  ○ Email + Password + Google + GitHub
│  ○ No auth (add later)
│
◆  Password reset method?
│  ● OTP via email (default — 6-digit code)
│  ○ Magic link (token in URL)
│  ○ Both (OTP + magic link fallback)
│
◆  Are roles required?
│  ● Yes (recommended)
│  ○ No
│
◆  Can a user have multiple roles?
│  ● No — single role per user (stores current_role on users table)
│  ○ Yes — many-to-many (creates roles + role_user tables)
│
◆  Testing framework?
│  ● bun:test (default — built into Bun)
│  ○ Vitest
│  ○ Jest
│  ○ None (add later)
│
◆  Include API docs?
│  ● Swagger UI + Fiberplane
│  ○ Swagger UI only
│  ○ Scalar API Reference
│  ○ None
│
└  Scaffolding project...

  ✔ Created project structure
  ✔ Generated config files
  ✔ Installing dependencies (latest versions)...
  ✔ Done!

  cd my-app
  bun dev
```

### 13.2 What the Wizard Installs

Every dependency is installed at its **latest** version. The CLI runs `bun add hono@latest` (not `hono@^4.12.0`).

**Always installed (core):**

| Package | Purpose |
|---|---|
| `hono` | Web framework |
| `zod` | Validation |
| `@hono/zod-validator` | Hono ↔ Zod bridge |
| `drizzle-orm` | ORM |
| `drizzle-kit` (dev) | Migrations CLI |
| `unplugin-auto-import` (dev) | Auto-imports for server + client |

**Conditional — by deployment target:**

| Target | Installed | Dev deps |
|---|---|---|
| Cloudflare Workers | — | `wrangler`, `@cloudflare/workers-types` |
| Cloudflare Pages | — | `wrangler`, `@cloudflare/workers-types` |
| Bun | — | `@types/bun` |
| Node.js | `@hono/node-server` | `tsx` |
| Deno | — | — |
| AWS Lambda | `@hono/aws-lambda` | — |
| Vercel | `@hono/vercel` | — |
| Netlify | `@hono/netlify` | — |
| Fastly | — | `@fastly/js-compute` |
| Docker (Bun) | — | `@types/bun` |
| Docker (Node) | `@hono/node-server` | `tsx` |

**Conditional — by database:**

| Database | Installed | Drizzle dialect |
|---|---|---|
| PostgreSQL (pg) | `pg` | `pg` |
| PostgreSQL (Neon) | `@neondatabase/serverless` | `neon-http` or `neon-websocket` |
| PostgreSQL (Supabase) | `postgres` | `postgres-js` |
| PostgreSQL (Xata) | `@xata.io/client` | `xata-http` |
| MySQL (mysql2) | `mysql2` | `mysql2` |
| PlanetScale | `@planetscale/database` | `planetscale` |
| SQLite (better-sqlite3) | `better-sqlite3` | `better-sqlite3` |
| SQLite (Bun) | — (built-in) | `bun-sqlite` |
| Turso / libSQL | `@libsql/client` | `turso` |
| Cloudflare D1 | — (binding) | `d1` |

**Conditional — by email:**

| Provider | Installed |
|---|---|
| Resend | `resend` |
| SMTP | `nodemailer` |
| AWS SES | `@aws-sdk/client-ses` |
| WazobiaMail | `wazobiamail` (coming soon) |
| Custom | — |

**Conditional — by file storage:**

| Driver | Installed | Notes |
|---|---|---|
| Local / disk | — (built-in `node:fs` / Bun APIs) | Default — files saved to `./storage` |
| Cloudflare R2 | — (binding) | S3-compatible, uses `env.MY_BUCKET` |
| Cloudinary | `cloudinary` | Image CDN — upload, transform, optimize |
| AWS S3 | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | Standard S3 bucket |
| Bunny.net | — (uses native `fetch` — no SDK needed) | CDN storage — `https://storage.bunnycdn.com` REST API |

> **Bunny.net Storage** uses a simple REST API with an `AccessKey` header — no SDK required. Vono generates a typed `BunnyStorage` client wrapper.

**Conditional — by notifications:**

| Choice | What’s generated | Extra deps |
|---|---|---|
| Yes | Drizzle `notifications` + `notification_preferences` tables, notification service/controller/routes, preferences API, notifications page (fullstack) | — (uses existing Drizzle + Hono) |
| No | Nothing | — |

**Conditional — by logging:**

| Choice | What’s generated | Extra deps | Behavior |
|---|---|---|---|
| Yes (queue available) | Drizzle `activity_logs` table, logging service, queue job | — (uses existing queue driver) | Log events dispatched via queue for async persistence |
| Yes (no queue) | Drizzle `activity_logs` table, logging service | — | Log events written synchronously to DB |
| No | Nothing | — | — |

**Conditional — by WebSocket driver:**

| Driver | Server deps | Client deps | Works on |
|---|---|---|---|
| Hono WebSocket (built-in) | — (included in `hono`) | — (native `WebSocket` API) | All runtimes (Bun, Node via `@hono/node-ws`, CF Workers, Deno) |
| Socket.IO (Bun) | `socket.io`, `@socket.io/bun-engine` | `socket.io-client` | Bun / Docker (Bun) only |
| Socket.IO (Node) | `socket.io` | `socket.io-client` | Node / Docker (Node) only |

**Conditional — full-stack (Vue frontend):**

| Package | Purpose |
|---|---|
| `vue` | UI framework |
| `vue-router` | Client routing (v5 — includes file-based routing plugin) |
| `pinia` | State management |
| `@nuxt/ui` | UI component library (includes Tailwind CSS) |
| `@unhead/vue` | Head/meta management |
| `@vitejs/plugin-vue` (dev) | Vite Vue plugin |
| `@hono/vite-dev-server` (dev) | Vite ↔ Hono bridge |

**Conditional — by queue driver:**

Only the selected driver's deps are installed — never the others:

| Driver | Installed | Works on |
|---|---|---|
| BullMQ + Redis | `bullmq`, `ioredis` | Bun / Node / Docker (persistent process with TCP to Redis) |
| Cloudflare Queues | — (binding) | CF Workers / Pages |
| AWS SQS | `@aws-sdk/client-sqs` | AWS Lambda |
| Upstash QStash | `@upstash/qstash` | Any runtime (HTTP-based) |
| Sync | — | Any (dev only, runs in-process) |

**Conditional — by cache driver:**

| Driver | Installed | Works on |
|---|---|---|
| Upstash | `@upstash/redis` | Any runtime (HTTP-based, no TCP needed) |
| Cloudflare KV | — (binding) | CF Workers / Pages |
| Redis | `ioredis` | Bun / Node / Docker (TCP connection) |
| In-memory | — | Any (dev only, not shared across workers) |

**Conditional — by testing framework:**

| Framework | Installed (dev) | Notes |
|---|---|---|
| `bun:test` | — (built into Bun) | Default — zero install, fastest startup |
| Vitest | `vitest`, `@vitest/coverage-v8` | Best for Vite projects, ESM-native |
| Jest | `jest`, `@types/jest`, `ts-jest` | Legacy compat, CommonJS-first |

**Conditional — API docs:**

| Choice | Installed |
|---|---|
| Swagger UI + Fiberplane | `@hono/swagger-ui`, `@fiberplane/hono` |
| Swagger UI only | `@hono/swagger-ui` |
| Scalar | `@scalar/hono-api-reference` |

### 13.3 TypeScript vs JavaScript

Hono works with both. When **JavaScript** is selected:

- All generated files use `.js` / `.vue` (no `.ts`)
- JSDoc type annotations are added for editor intellisense
- No `tsconfig.json` — uses `jsconfig.json` instead
- No `typescript` or `vue-tsc` dev deps
- Zod schemas still work (Zod is runtime, not TS-only)

When **TypeScript** is selected (default):

- All files use `.ts`
- `tsconfig.json` with strict mode
- `typescript` and `vue-tsc` added as dev deps
- Full type inference on `c.var`, `c.env`, Drizzle schemas

```js
// JavaScript mode — JSDoc gives you autocomplete without TS:

/** @param {import('hono').Context<{ Variables: import('./types').AppVariables }>} c */
export async function list(c) {
  const plans = await c.get('db').select().from(plans)
  return c.json(success('Plans loaded', plans))
}
```

### 13.4 Package: `create-vono`

The CLI is published as `create-vono` on npm. It uses:

| Dep | Purpose |
|---|---|
| `@clack/prompts` | Beautiful terminal prompts (same as Nuxt/SvelteKit use) |
| `giget` | Template fetching |
| `kolorist` | Terminal colors |
| `execa` | Running install commands |

The CLI fetches latest package versions at install time by running:

```ts
// Inside create-vono:
const deps = ['hono', 'zod', 'drizzle-orm', /* ... based on choices */]
const installCmd = packageManager === 'bun'
  ? `bun add ${deps.map(d => `${d}@latest`).join(' ')}`
  : `${pm} install ${deps.map(d => `${d}@latest`).join(' ')}`
```

---

## 14. Auto-Imports — Server & Client

Vono uses `unplugin-auto-import` for **both** the Hono server code and the Vue client code. No more repetitive imports.

### 14.1 Server-Side Auto-Imports

Shared middleware, utils, and common Hono helpers are auto-imported across all server files:

```ts
// vono.config.ts (server auto-import config)
export default defineVonoConfig({
  autoImport: {
    server: {
      // These directories are auto-imported in all server .ts files
      dirs: [
        'src/shared/utils/**',       // success(), error(), generateId(), etc.
        'src/shared/middleware/**',   // authMiddleware, isAdmin, zodValidator, etc.
        'src/shared/dto/**',         // QuerySchema, etc.
        'src/lib/**',                // signAccessToken, hashPassword, etc.
      ],
      // Explicit package imports
      imports: [
        {
          'hono': ['Hono'],
          'hono/http-exception': ['HTTPException'],
          'drizzle-orm': ['eq', 'and', 'or', 'desc', 'asc', 'isNull', 'isNotNull', 'sql', 'count', 'like', 'inArray'],
          'zod': ['z'],
        },
      ],
    },
  },
})
```

After this, you write server code without imports:

```ts
// src/modules/plans/plans.service.ts
// No imports needed — all auto-imported:

export class PlansService {
  constructor(private db: DrizzleDb) {}

  async list() {
    return this.db
      .select().from(schema.plans)
      .where(withSoftDeletes(schema.plans))     // ← auto-imported
      .orderBy(desc(schema.plans.createdAt))    // ← auto-imported
  }

  async create(data: CreatePlanInput) {
    const id = `plan_${generateId()}`           // ← auto-imported
    const [plan] = await this.db
      .insert(schema.plans).values({ id, ...data }).returning()
    return plan
  }
}
```

### 14.2 Client-Side Auto-Imports

Vue composables, Vue Router, Pinia, and your own utilities:

```ts
// vono.config.ts (client auto-import config)
export default defineVonoConfig({
  autoImport: {
    client: {
      dirs: [
        'src/composables/**',
        'src/stores/**',
        'src/utils/client/**',
      ],
      imports: [
        'vue',          // ref, computed, watch, onMounted, etc.
        'vue-router',   // useRoute, useRouter
        'pinia',        // defineStore, storeToRefs
      ],
      vueTemplate: true,  // Also works in <template>
    },
  },
})
```

### 14.3 Custom Auto-Import Entries

Add your own files/packages to auto-import via config:

```ts
// vono.config.ts
export default defineVonoConfig({
  autoImport: {
    server: {
      dirs: [
        'src/shared/utils/**',
        'src/lib/**',
        'src/jobs/**',          // ← add your own
      ],
      imports: [
        {
          'my-custom-pkg': ['myHelper', 'myOtherHelper'],
        },
      ],
    },
  },
})
```

### 14.4 Generated Type Declarations

Auto-imports generate `.d.ts` files so your editor knows about everything:

```
src/
├── auto-imports.d.ts          # Server auto-imports
├── auto-imports-client.d.ts   # Client auto-imports
└── components.d.ts            # Vue component auto-imports
```

### 14.5 Underlying Vite Config

Vono generates this `vite.config.ts` under the hood:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import devServer from '@hono/vite-dev-server'
import AutoImport from 'unplugin-auto-import/vite'
import VueRouter from 'vue-router/vite'

export default defineConfig({
  plugins: [
    // VueRouter MUST come before Vue — file-based routing from *.page.vue
    VueRouter({
      routesFolder: [
        { src: 'src/modules' },
      ],
      extensions: ['.page.vue'],
      filePatterns: ['**/*.page'],
      dts: 'src/route-map.d.ts',
    }),
    devServer({
      entry: './index.ts',
      exclude: [
        /.*\.vue($|\?)/,
        /^\/(public|assets|static)\/.+/,
        /.*\.(s?css|less)($|\?)/,
        /.*\.(svg|png|jpg|jpeg|gif|ico|woff2?)($|\?)/,
      ],
    }),
    vue(),
    ui({ ui: { colors: { primary: 'green', neutral: 'zinc' } } }),
    AutoImport({
      imports: [
        'vue', 'vue-router', 'pinia',
        {
          'hono': ['Hono'],
          'hono/http-exception': ['HTTPException'],
          'drizzle-orm': ['eq', 'and', 'or', 'desc', 'asc', 'isNull', 'isNotNull', 'sql', 'count'],
          'zod': ['z'],
        },
      ],
      dirs: [
        'src/shared/utils/**',
        'src/shared/middleware/**',
        'src/shared/dto/**',
        'src/lib/**',
        'src/composables/**',
        'src/stores/**',
      ],
      dts: 'src/auto-imports.d.ts',
      vueTemplate: true,
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
})
```

---

## 15. Nuxt UI — Default Frontend UI

Full-stack Vono projects use **Nuxt UI v4** as the default component library. 125+ accessible components, Tailwind CSS, dark mode, icons — all pre-configured.

### 15.1 Pre-configured Setup

The CLI generates these files automatically:

```css
/* src/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!--head-outlet-->
</head>
<body>
  <div id="app" class="isolate"><!--ssr-outlet--></div>
  <script type="module" src="/src/app.ts"></script>
  <!--state-outlet-->
</body>
</html>
```

```ts
// src/main.ts (app factory)
import './assets/css/main.css'
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'
import { createHead } from '@unhead/vue'
import App from './App.vue'
import { createRouter } from './router'

export function createApp(isServer = false) {
  const app = createSSRApp(App)
  const pinia = createPinia()
  const head = createHead()
  const router = createRouter(isServer)

  app.use(pinia)
  app.use(head)
  app.use(router)
  app.use(ui)

  return { app, pinia, head, router }
}
```

```vue
<!-- src/App.vue -->
<template>
  <UApp>
    <RouterView />
  </UApp>
</template>
```

### 15.2 Theme Configuration

Customize colors in `vono.config.ts`:

```ts
export default defineVonoConfig({
  ui: {
    colors: {
      primary: 'green',     // Brand color
      neutral: 'zinc',      // Gray scale
    },
  },
})
```

### 15.3 Icons

Nuxt UI uses Iconify. Install icon sets and use directly:

```bash
bun add -D @iconify-json/lucide @iconify-json/simple-icons
```

```vue
<UIcon name="i-lucide-mail" class="size-5" />
<UButton icon="i-lucide-plus" label="Create" />
```

---

## 16. Vono Artisan — Scaffolding CLI

Laravel-style `make:*` commands for generating boilerplate. Respects the TS/JS choice from install.

```bash
bun vono make:module   posts       # Full module (API + frontend files)
bun vono make:service  email       # Service only
bun vono make:controller payment   # Controller only
bun vono make:dto      invoice     # DTO (Zod schema) only
bun vono make:routes   webhook     # Routes file only
bun vono make:schema   posts       # Drizzle schema inside a module
bun vono make:policy   posts       # Authorization policy for a module
bun vono make:resource posts       # API response transformer (optional)
bun vono make:middleware tenant    # Middleware only
bun vono make:page     posts/Edit  # Vue page inside a module
bun vono make:component posts/PostCard # Vue component inside a module
bun vono make:composable posts/usePostEditor # Composable inside a module
bun vono make:store    cart         # Pinia store inside a module
bun vono make:migration create_orders  # Drizzle migration (SQL)
bun vono make:seed     plans        # Database seed file
bun vono make:test     auth         # Test file
bun vono make:notification order_shipped # Notification type + template
```

#### Post-Install Add Commands

Features that were skipped during install can be added later via `vono add`. Each command installs dependencies, generates files (schema, service, routes, pages), and updates `vono.config.ts`:

```bash
bun vono add notifications          # Add notifications module (table + API + page)
bun vono add logging                # Add activity logging (table + service + queue job)
bun vono add websocket              # Add WebSocket support (prompts for Hono WS or Socket.IO)
bun vono add auth                   # Add auth scaffolding (login/register/forgot pages + APIs)
bun vono add storage                # Add file storage (prompts for driver: local/R2/S3/Cloudinary/Bunny)
bun vono add queue                  # Add queue driver (prompts for BullMQ/CF Queues/SQS/Upstash)
bun vono add cache                  # Add cache driver (prompts for Upstash/KV/Redis/Memory)
bun vono add email                  # Add email provider (prompts for Resend/SMTP/SES)
bun vono add oauth google           # Add Google OAuth to existing auth
bun vono add oauth github           # Add GitHub OAuth to existing auth
```

> **`vono add` is idempotent** — running it again detects existing files and skips them. It only adds what's missing.

### 16.1 `make:module` — Full Module Scaffold

The most powerful command. Creates API + frontend files in one module folder, then auto-mounts the route:

```bash
$ bun vono make:module posts

◆  What does this module need?
│  ◼ API (routes + controller + service + dto)
│  ◼ Pages
│  ◼ Composables
│  ◻ Components

  ✔ Created src/modules/posts/posts.routes.ts
  ✔ Created src/modules/posts/posts.controller.ts
  ✔ Created src/modules/posts/posts.service.ts
  ✔ Created src/modules/posts/posts.dto.ts
  ✔ Created src/modules/posts/posts.schema.ts
  ✔ Created src/modules/posts/index.page.vue
  ✔ Created src/modules/posts/composables/usePosts.ts
  ✔ Registered API route in src/index.ts → api.route("/posts", postsRoutes)
  ✔ Auto-imported schema into src/db/schema.ts

  Route /posts auto-registered from index.page.vue (file-based routing)
  Run `bun dev` to see API at /api/v1/posts and page at /posts
```

**In API-only mode**, it skips pages/components/composables. **In frontend-only mode**, it skips routes/controller/service/dto. **No router registration needed** — `*.page.vue` files are auto-discovered by Vue Router v5’s file-based routing plugin.

**Generated `posts.routes.ts`:**

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Posts Routes
 *  Module:  posts
 *  Path:    /api/v1/posts
 * ──────────────────────────────────────────────────────────────
 *  Generated by Vono CLI — https://vono.dev
 *  Feel free to modify this file to fit your needs.
 * ──────────────────────────────────────────────────────────────
 */

import { Hono } from 'hono'
import type { AppVariables } from '../../types'
import { authMiddleware, isAdmin } from '../../shared/middleware/auth.middleware'
import { PostsService } from './posts.service'
import { PostsController } from './posts.controller'

const postsRoutes = new Hono<{ Variables: AppVariables }>()

postsRoutes.use('*', authMiddleware)
postsRoutes.use('*', async (c, next) => {
  const service = new PostsService(c.get('db'))
  c.set('postsController', new PostsController(service))
  await next()
})

postsRoutes.get('/', (c) => (c.get('postsController') as PostsController).list(c))
postsRoutes.get('/:id', (c) => (c.get('postsController') as PostsController).getById(c))
postsRoutes.post('/', (c) => (c.get('postsController') as PostsController).create(c))
postsRoutes.put('/:id', (c) => (c.get('postsController') as PostsController).update(c))
postsRoutes.delete('/:id', (c) => (c.get('postsController') as PostsController).remove(c))

export { postsRoutes }
```

**Generated `posts.controller.ts`:**

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Posts Controller
 *  Module:  posts
 * ──────────────────────────────────────────────────────────────
 *  Handles HTTP request/response for the Posts module.
 *  Parses input, delegates to PostsService, returns JSON.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import type { Context } from 'hono'
import type { AppVariables } from '../../types'
import { success, error } from '../../shared/utils/response'
import type { PostsService } from './posts.service'

type AppContext = Context<{ Variables: AppVariables }>

export class PostsController {
  constructor(private service: PostsService) {}

  async list(c: AppContext) {
    const query = c.req.query()
    const result = await this.service.list(query)
    return c.json(success('Posts loaded', result))
  }

  async getById(c: AppContext) {
    const { id } = c.req.param()
    const post = await this.service.getById(id)
    if (!post) return c.json(error('Post not found'), 404)
    return c.json(success('Post loaded', post))
  }

  async create(c: AppContext) {
    const body = await c.req.json()
    const post = await this.service.create(body)
    return c.json(success('Post created', post), 201)
  }

  async update(c: AppContext) {
    const { id } = c.req.param()
    const body = await c.req.json()
    const post = await this.service.update(id, body)
    if (!post) return c.json(error('Post not found'), 404)
    return c.json(success('Post updated', post))
  }

  async remove(c: AppContext) {
    const { id } = c.req.param()
    const deleted = await this.service.softDelete(id)
    if (!deleted) return c.json(error('Post not found'), 404)
    return c.json(success('Post deleted', deleted))
  }
}
```

**Generated `posts.service.ts`:**

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Posts Service
 *  Module:  posts
 * ──────────────────────────────────────────────────────────────
 *  Pure business logic + database queries for Posts.
 *  No HTTP concerns — receives a Drizzle DB instance,
 *  returns data or throws domain errors.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { eq, and, desc, isNull } from 'drizzle-orm'
import type { DrizzleDb } from '../../db'
import * as schema from '../../db/schema'
import { generateId } from '../../shared/utils/id'
import { withSoftDeletes } from '../../shared/utils/softDeletes'
import { buildPaginationMeta } from '../../shared/utils/pagination'

export class PostsService {
  constructor(private db: DrizzleDb) {}

  async list(query: { page?: string; limit?: string }) {
    const page = Number(query.page) || 1
    const limit = Math.min(Number(query.limit) || 24, 100)
    const offset = (page - 1) * limit

    const [items, [{ total }]] = await Promise.all([
      this.db.select().from(schema.posts)
        .where(withSoftDeletes(schema.posts))
        .orderBy(desc(schema.posts.createdAt))
        .limit(limit).offset(offset),
      this.db.select({ total: count() }).from(schema.posts)
        .where(withSoftDeletes(schema.posts)),
    ])

    return { items, meta: buildPaginationMeta({ page, limit, total }) }
  }

  async getById(id: string) {
    const [post] = await this.db.select().from(schema.posts)
      .where(and(eq(schema.posts.id, id), withSoftDeletes(schema.posts)))
      .limit(1)
    return post ?? null
  }

  async create(data: Record<string, unknown>) {
    const id = `post_${generateId()}`
    const [post] = await this.db.insert(schema.posts)
      .values({ id, ...data }).returning()
    return post
  }

  async update(id: string, data: Record<string, unknown>) {
    const [post] = await this.db.update(schema.posts)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.posts.id, id), withSoftDeletes(schema.posts)))
      .returning()
    return post ?? null
  }

  async softDelete(id: string) {
    const [post] = await this.db.update(schema.posts)
      .set({ deletedAt: new Date().toISOString() })
      .where(and(eq(schema.posts.id, id), isNull(schema.posts.deletedAt)))
      .returning({ id: schema.posts.id })
    return post ?? null
  }
}
```

**Generated `posts.dto.ts`:**

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Posts DTO — Data Transfer Objects
 *  Module:  posts
 * ──────────────────────────────────────────────────────────────
 *  Zod schemas for request validation + TypeScript types.
 *  Used by the controller to validate incoming data.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { z } from 'zod'

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
})
export type CreatePostInput = z.infer<typeof CreatePostSchema>

export const UpdatePostSchema = CreatePostSchema.partial()
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
```

### 16.2 Individual Generators

```bash
# Service only — useful when adding logic to an existing module
$ bun vono make:service notification
  ✔ Created src/modules/notification/notification.service.ts

# DTO only
$ bun vono make:dto payment
  ✔ Created src/modules/payment/payment.dto.ts

# Middleware
$ bun vono make:middleware tenant
  ✔ Created src/shared/middleware/tenant.middleware.ts

# Vue page (full-stack mode) — goes INSIDE the module as *.page.vue
$ bun vono make:page posts/edit
  ✔ Created src/modules/posts/edit.page.vue

# Composable — goes INSIDE the module
$ bun vono make:composable posts/usePostEditor
  ✔ Created src/modules/posts/composables/usePostEditor.ts

# Component — goes INSIDE the module
$ bun vono make:component posts/PostCard
  ✔ Created src/modules/posts/components/PostCard.vue

# Shared composable (no module prefix) — goes in src/shared/composables/
$ bun vono make:composable useFormErrors
  ✔ Created src/shared/composables/useFormErrors.ts

# Shared component (no module prefix) — goes in src/shared/components/
$ bun vono make:component AppLoader
  ✔ Created src/shared/components/AppLoader.vue

# Pinia store — goes INSIDE the module
$ bun vono make:store posts/posts
  ✔ Created src/modules/posts/stores/posts.ts

# Test
$ bun vono make:test auth
  ✔ Created tests/auth.test.ts
```

### 16.3 Package: `vono-cli`

The artisan CLI is a dev dependency auto-installed by `create-vono`:

```json
{
  "devDependencies": {
    "vono-cli": "latest"
  },
  "scripts": {
    "vono": "vono"
  }
}
```

Run via `bun vono <command>` or `npx vono <command>`.

| Dep | Purpose |
|---|---|
| `@clack/prompts` | Interactive prompts for `make:module` options |
| `handlebars` | Template rendering for generated files |
| `fs-extra` | File creation helpers |

---

## 17. Migrations & Module Schemas

### 17.1 Schema Lives in Modules

Every module owns its Drizzle table definitions. When you scaffold a module with API support, a `<module>.schema.ts` file is created automatically:

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Posts Schema — Database Tables
 *  Module:  posts
 * ──────────────────────────────────────────────────────────────
 *  Drizzle table definitions for this module.
 *  Auto-imported into src/db/schema.ts barrel file.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/modules/posts/posts.schema.ts
import { pgTable, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { timestamps, softDeletable } from '../../db/mixins'

export const posts = pgTable('posts', {
  id: varchar('id', { length: 30 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  authorId: varchar('author_id', { length: 30 }).notNull(),
  ...timestamps,
  ...softDeletable,
})
```

**Single role** (user can only have one role — `current_role` on users table):

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Auth Schema — Database Tables (Single Role Mode)
 *  Module:  auth
 * ──────────────────────────────────────────────────────────────
 *  Drizzle table definitions for authentication.
 *  Auto-imported into src/db/schema.ts barrel file.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/modules/auth/auth.schema.ts — single role mode
import { pgTable, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { timestamps, softDeletable } from '../../db/mixins'

export const users = pgTable('users', {
  id: varchar('id', { length: 30 }).primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  passwordHash: text('password_hash'),
  currentRole: varchar('current_role', { length: 30 }).default('user').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  ...timestamps,
  ...softDeletable,
}, (table) => [
  index('idx_users_current_role').on(table.currentRole),
])

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 30 }).primaryKey(),
  userId: varchar('user_id', { length: 30 }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ...timestamps,
})
```

**Multiple roles** (user can have many roles — `roles` + `role_user` junction table + `current_role` on users):

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Auth Schema — Database Tables (Multi-Role Mode)
 *  Module:  auth
 * ──────────────────────────────────────────────────────────────
 *  Drizzle table definitions for authentication + RBAC.
 *  Includes: users, roles, role_user junction, sessions.
 *  Auto-imported into src/db/schema.ts barrel file.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/modules/auth/auth.schema.ts — multi-role mode
import { pgTable, varchar, text, boolean, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { timestamps, softDeletable } from '../../db/mixins'

export const users = pgTable('users', {
  id: varchar('id', { length: 30 }).primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  passwordHash: text('password_hash'),
  currentRole: varchar('current_role', { length: 30 }).default('user').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  ...timestamps,
  ...softDeletable,
}, (table) => [
  index('idx_users_current_role').on(table.currentRole),
])

export const roles = pgTable('roles', {
  id: varchar('id', { length: 30 }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),  // 'admin', 'editor', 'viewer'
  description: text('description'),
  ...timestamps,
})

export const roleUser = pgTable('role_user', {
  userId: varchar('user_id', { length: 30 }).notNull(),
  roleId: varchar('role_id', { length: 30 }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.roleId] }),
  index('idx_role_user_user_id').on(table.userId),
  index('idx_role_user_role_id').on(table.roleId),
])

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 30 }).primaryKey(),
  userId: varchar('user_id', { length: 30 }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ...timestamps,
})
```

In both modes, `current_role` on the `users` table stores the user's active role. In multi-role mode, users can switch their `current_role` to any role assigned to them in the `role_user` junction table.

**No roles** — if roles are not selected, the users table has no role column and the gates/policies rely on custom logic instead.

### 17.2 Central Schema — Auto-Import Barrel

The central `src/db/schema.ts` is a **barrel file** that auto-imports and re-exports every module schema. Vono generates and maintains this file automatically whenever you create or remove a module:

```ts
// src/db/schema.ts — AUTO-GENERATED, DO NOT EDIT
// This file is regenerated by `vono make:module` and `vono remove:module`.
// To add tables, create/edit the schema file inside your module.

export * from '../modules/auth/auth.schema'
export * from '../modules/posts/posts.schema'
export * from '../modules/billing/billing.schema'
export * from '../modules/domains/domains.schema'
export * from '../modules/campaigns/campaigns.schema'
export * from '../modules/contacts/contacts.schema'
export * from '../modules/plans/plans.schema'
export * from '../modules/subscriptions/subscriptions.schema'
// ... one line per module that has a schema file
```

Drizzle Kit reads this single file as its schema source:

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',     // ← barrel that re-exports all module schemas
  out: './drizzle',                  // ← generated SQL migration files
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

This means:
- **You define tables** inside your module (`posts.schema.ts`)
- **Vono auto-imports them** into `src/db/schema.ts`
- **Drizzle Kit sees all tables** from one entry point
- **Migration SQL files** are generated in `drizzle/` as usual

### 17.3 How Auto-Import Works

When `make:module` creates a schema file, or `remove:module` deletes one, Vono scans all modules for `*.schema.ts` files and regenerates the barrel:

```ts
// Inside vono-cli — schema barrel generator
import { globSync } from 'fs'
import { writeFileSync } from 'fs'

function regenerateSchemaBarrel() {
  const schemaFiles = globSync('src/modules/*/*.schema.ts')
  const lines = [
    '// src/db/schema.ts — AUTO-GENERATED, DO NOT EDIT',
    '// Run `vono make:module` or edit module schema files directly.',
    '',
    ...schemaFiles.map(f => {
      const rel = f.replace('src/', '../')
                    .replace('.ts', '')
      return `export * from '${rel}'`
    }),
    '',
  ]
  writeFileSync('src/db/schema.ts', lines.join('\n'))
}
```

> **You never edit `src/db/schema.ts` manually.** Add tables by creating or editing `<module>.schema.ts` inside the module, then run `bun vono schema:sync` if needed (or it happens automatically during `make:module`).

### 17.4 Migration Commands

Vono wraps Drizzle Kit with friendlier, Laravel-inspired commands:

```bash
# Generate migration SQL from schema changes
bun vono migrate:make create_posts_table

# Run all pending migrations
bun vono migrate:run

# Rollback the last batch of migrations
bun vono migrate:rollback

# Check migration status
bun vono migrate:status

# Reset DB (rollback all + re-run all)
bun vono migrate:reset

# Fresh DB (drop all tables + re-run all migrations + seed)
bun vono migrate:fresh --seed

# Push schema directly (dev only, no migration files)
bun vono db:push

# Open Drizzle Studio (DB browser)
bun vono db:studio

# Regenerate schema barrel from all module schemas
bun vono schema:sync

# Seed the database
bun vono db:seed

# Seed a specific seeder
bun vono db:seed plans
```

### 17.5 Migration File Generation

```bash
$ bun vono migrate:make create_posts_table

  ✔ Synced schema barrel (src/db/schema.ts)
  ✔ Generated drizzle/0018_create_posts_table.sql
```

`migrate:make` first syncs the schema barrel to ensure all module schemas are included, then runs `drizzle-kit generate`. The SQL file goes in `drizzle/` — editable if you need custom DDL.

### 17.6 Underlying Commands

Vono commands map to Drizzle Kit:

| Vono command | Drizzle Kit equivalent |
|---|---|
| `migrate:make <name>` | `drizzle-kit generate` (with custom naming) |
| `migrate:run` | `drizzle-kit migrate` |
| `migrate:status` | `drizzle-kit check` |
| `db:push` | `drizzle-kit push` |
| `db:studio` | `drizzle-kit studio` |
| `schema:sync` | *(Vono internal — regenerates barrel)* |

### 17.7 Seed Files

```bash
$ bun vono make:seed plans
  ✔ Created src/db/seeds/plans.seed.ts
```

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Plans Seed
 * ──────────────────────────────────────────────────────────────
 *  Populates the plans table with initial data.
 *  Run with: bun vono db:seed plans
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/db/seeds/plans.seed.ts
import type { DrizzleDb } from '../index'
import * as schema from '../schema'
import { generateId } from '../../shared/utils/id'

export async function seed(db: DrizzleDb) {
  await db.insert(schema.plans).values([
    { id: `plan_${generateId()}`, name: 'Free', usdPrice: '0', status: 'active' },
    { id: `plan_${generateId()}`, name: 'Pro', usdPrice: '29', status: 'active' },
    { id: `plan_${generateId()}`, name: 'Enterprise', usdPrice: '99', status: 'active' },
  ]).onConflictDoNothing()
}
```

### 17.8 Cross-Module Relations

When tables in different modules reference each other, define relations in a dedicated file:

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Cross-Module Relations
 * ──────────────────────────────────────────────────────────────
 *  Drizzle ORM relation definitions that wire tables from
 *  different modules together. Keeps modules decoupled —
 *  each module defines its own tables, this file connects them.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/db/relations.ts
import { relations } from 'drizzle-orm'
import { users, roles, roleUser } from '../modules/auth/auth.schema'
import { posts } from '../modules/posts/posts.schema'
import { subscriptions } from '../modules/subscriptions/subscriptions.schema'
import { plans } from '../modules/plans/plans.schema'

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  subscriptions: many(subscriptions),
  roleAssignments: many(roleUser),    // multi-role only
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(roleUser),              // multi-role only
}))

export const roleUserRelations = relations(roleUser, ({ one }) => ({
  user: one(users, { fields: [roleUser.userId], references: [users.id] }),
  role: one(roles, { fields: [roleUser.roleId], references: [roles.id] }),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
}))
```

This keeps modules decoupled — each module defines its own tables, and `relations.ts` wires them together.

---

## 18. Model Sugar — Soft Deletes, Scopes, Timestamps

Laravel-style query sugar for Drizzle, designed to be **composable and zero-overhead** (no ORM magic — just functions that return SQL conditions).

### 18.1 Timestamps Mixin

Add `createdAt`, `updatedAt`, `deletedAt` to any Drizzle table:

```ts
// src/db/mixins/timestamps.ts
import { timestamp } from 'drizzle-orm/pg-core'

export const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}

export const softDeletable = {
  ...timestamps,
  deletedAt: timestamp('deleted_at'),
}
```

```ts
// src/db/schema.ts
import { pgTable, text, integer } from 'drizzle-orm/pg-core'
import { softDeletable } from './mixins/timestamps'

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  accountId: integer('account_id').notNull(),
  ...softDeletable,  // ← adds createdAt, updatedAt, deletedAt
})
```

### 18.2 Soft Deletes

Laravel: `$query->withTrashed()`. Vono: `withTrashed()`.

```ts
// src/shared/utils/softDeletes.ts
import { isNull, isNotNull, type SQL } from 'drizzle-orm'

/** Exclude soft-deleted records (default behavior) */
export function withSoftDeletes(table: any): SQL<unknown> | undefined {
  if (table && 'deletedAt' in table) return isNull(table.deletedAt)
  return undefined
}

/** Only soft-deleted records */
export function onlyTrashed(table: any): SQL<unknown> | undefined {
  if (table && 'deletedAt' in table) return isNotNull(table.deletedAt)
  return undefined
}

/** All records — ignore soft deletes */
export function withTrashed(): undefined {
  return undefined
}

/** Perform a soft delete */
export function softDelete(db: DrizzleDb, table: any, condition: SQL) {
  return db.update(table)
    .set({ deletedAt: new Date().toISOString() })
    .where(and(condition, isNull(table.deletedAt)))
    .returning({ id: table.id })
}

/** Restore a soft-deleted record */
export function restore(db: DrizzleDb, table: any, condition: SQL) {
  return db.update(table)
    .set({ deletedAt: null })
    .where(and(condition, isNotNull(table.deletedAt)))
    .returning({ id: table.id })
}

/** Permanently delete (force delete) */
export function forceDelete(db: DrizzleDb, table: any, condition: SQL) {
  return db.delete(table).where(condition).returning({ id: table.id })
}
```

**Usage comparison:**

| Laravel | Vono |
|---|---|
| `Post::all()` | `db.select().from(posts).where(withSoftDeletes(posts))` |
| `Post::withTrashed()->get()` | `db.select().from(posts)` (no filter) |
| `Post::onlyTrashed()->get()` | `db.select().from(posts).where(onlyTrashed(posts))` |
| `$post->delete()` | `softDelete(db, posts, eq(posts.id, id))` |
| `$post->restore()` | `restore(db, posts, eq(posts.id, id))` |
| `$post->forceDelete()` | `forceDelete(db, posts, eq(posts.id, id))` |

### 18.3 Query Scopes

Laravel has `scopeActive()`, `scopePublished()`. In Vono, scopes are **plain functions** that return Drizzle SQL conditions — composable, tree-shakeable, zero overhead:

```ts
// src/modules/posts/posts.scopes.ts
import { eq, and, gte, lte, isNull, type SQL } from 'drizzle-orm'
import * as schema from '../../db/schema'

/** Only published posts */
export function published(): SQL {
  return and(
    eq(schema.posts.status, 'published'),
    isNull(schema.posts.deletedAt),
  )!
}

/** Posts by a specific author */
export function byAuthor(accountId: number): SQL {
  return eq(schema.posts.accountId, accountId)
}

/** Posts created in date range */
export function createdBetween(from: string, to: string): SQL {
  return and(
    gte(schema.posts.createdAt, from),
    lte(schema.posts.createdAt, to),
  )!
}

/** Active accounts */
export function active(): SQL {
  return eq(schema.account.status, 1)
}

/** Scope: belongs to current user */
export function ownedBy(accountId: number): SQL {
  return eq(schema.posts.accountId, accountId)
}
```

**Composing scopes** — just use `and()` / `or()`:

```ts
// In service:
const posts = await this.db.select().from(schema.posts)
  .where(and(
    published(),                  // scope
    byAuthor(accountId),          // scope
    withSoftDeletes(schema.posts) // soft delete filter
  ))
  .orderBy(desc(schema.posts.createdAt))
  .limit(24)
```

**Performance note:** These are just SQL conditions composed at the query builder level — no hidden queries, no N+1, no magic. The final SQL is exactly what you'd write by hand.

### 18.4 Prefixed ID Generation

Laravel-style readable IDs with type prefixes:

```ts
// src/shared/utils/id.ts
export function generateId(): string {
  return crypto.randomUUID()
}

/** Prefixed ID: plan_550e8400-e29b-41d4-a716-446655440000 */
export function prefixedId(prefix: string): string {
  return `${prefix}_${generateId()}`
}
```

| Laravel | Vono |
|---|---|
| `$table->uuid('id')->primary()` | `id: text('id').primaryKey()` + `prefixedId('post')` |
| `Str::uuid()` | `generateId()` |

---

## 19. Vono Config — Runtime-Aware Configuration System

Like Laravel's `config/` directory and `.env`, Vono centralizes all configuration in `vono.config.ts` with environment-specific overrides from `.env`. The config is **runtime-aware** — it knows whether you're on Cloudflare Workers, Bun, or Node.js, and automatically selects the right drivers, queue backends, and adapters.

### 19.1 The Config File

```ts
// vono.config.ts
import { defineVonoConfig } from 'vono'

export default defineVonoConfig({
  // ─── App ────────────────────────────────────────────────
  app: {
    name: 'My App',
    url: env('APP_URL', 'http://localhost:8787'),
    env: env('NODE_ENV', 'development'),
    key: env('APP_KEY'),               // Auto-generated on create
    language: env('APP_LANG', 'ts'),    // 'ts' | 'js'
  },

  // ─── Runtime / Deployment ─────────────────────────────
  runtime: env('VONO_RUNTIME', 'cloudflare-workers'),
  //  'cloudflare-workers' | 'cloudflare-pages' | 'bun' | 'node'
  //  | 'deno' | 'aws-lambda' | 'vercel' | 'netlify' | 'fastly'

  // ─── Mode ──────────────────────────────────────────────
  mode: env('VONO_MODE', 'fullstack'),  // 'fullstack' | 'api'

  // ─── Database ─────────────────────────────────────────
  database: {
    driver: env('DB_DRIVER', 'pg'),
    //  'pg' | 'neon' | 'supabase' | 'xata' | 'mysql2'
    //  | 'planetscale' | 'better-sqlite3' | 'bun-sqlite'
    //  | 'turso' | 'd1'
    url: env('DATABASE_URL'),
    // Cloudflare Hyperdrive (auto-enabled when runtime is CF + driver is pg)
    hyperdrive: env('HYPERDRIVE_ID'),
  },

  // ─── Auth ─────────────────────────────────────────────
  auth: {
    jwt: {
      secret: env('JWT_SECRET'),
      accessTokenExpiry: 15 * 60,       // 15 minutes
      refreshTokenExpiry: 7 * 24 * 3600, // 7 days
    },
    oauth: {
      google: {
        clientId: env('GOOGLE_CLIENT_ID'),
        clientSecret: env('GOOGLE_CLIENT_SECRET'),
      },
      github: {
        clientId: env('GITHUB_CLIENT_ID'),
        clientSecret: env('GITHUB_CLIENT_SECRET'),
      },
    },
  },

  // ─── Email ────────────────────────────────────────────
  mail: {
    driver: env('MAIL_DRIVER', 'resend'),
    //  'resend' | 'smtp' | 'ses' | 'wazobiamail' | 'custom'
    from: {
      name: env('MAIL_FROM_NAME', 'My App'),
      address: env('MAIL_FROM_ADDRESS', 'noreply@example.com'),
    },
    // Driver-specific config (only the active driver is used)
    resend: {
      apiKey: env('RESEND_API_KEY'),
    },
    smtp: {
      host: env('SMTP_HOST', 'smtp.gmail.com'),
      port: envNumber('SMTP_PORT', 587),
      user: env('SMTP_USER'),
      pass: env('SMTP_PASS'),
      secure: envBool('SMTP_SECURE', false),
    },
    ses: {
      region: env('AWS_REGION', 'us-east-1'),
      accessKeyId: env('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
    },
  },

  // ─── Queue (runtime-aware) ────────────────────────────
  queue: {
    driver: env('QUEUE_DRIVER', 'auto'),
    //  'auto' | 'bullmq' | 'cloudflare-queues' | 'sqs' | 'upstash' | 'sync' | 'none'
    //
    //  'auto' selects based on runtime:
    //    bun/node/docker → 'bullmq'  (persistent process with TCP to Redis)
    //    cloudflare      → 'cloudflare-queues'
    //    aws-lambda      → 'sqs'
    //    vercel/netlify  → 'upstash'  (serverless — HTTP-based only)
    //    deno            → 'upstash'
    //    fastly          → 'upstash'
    //
    bullmq: {
      redis: env('REDIS_URL', 'redis://localhost:6379'),
    },
    sqs: {
      region: env('AWS_REGION', 'us-east-1'),
      queueUrl: env('SQS_QUEUE_URL'),
    },
    upstash: {
      url: env('UPSTASH_QSTASH_URL'),
      token: env('UPSTASH_QSTASH_TOKEN'),
    },
    cloudflareQueues: {
      binding: env('QUEUE_BINDING', 'MY_QUEUE'),
    },
  },

  // ─── Cache ────────────────────────────────────────────
  //  Upstash is the universal default — HTTP-based, works on every runtime.
  //  Override with 'kv' (Cloudflare) or 'redis' (Bun/Node with local Redis).
  cache: {
    driver: env('CACHE_DRIVER', 'upstash'),
    //  'upstash' | 'kv' | 'redis' | 'memory' | 'none'
    //
    //  Upstash Redis works on ANY runtime (HTTP, no TCP socket needed).
    //  'kv'     → Cloudflare Workers KV (CF only)
    //  'redis'  → ioredis (Bun / Node / Docker — needs TCP)
    //  'memory' → In-process Map (dev only, not shared across workers)
    //
    upstash: {
      url: env('UPSTASH_REDIS_URL'),
      token: env('UPSTASH_REDIS_TOKEN'),
    },
    kv: {
      binding: env('KV_BINDING', 'MY_KV'),
    },
    redis: {
      url: env('REDIS_URL', 'redis://localhost:6379'),
    },
    ttl: 3600,  // Default TTL in seconds
  },

  // ─── Testing ──────────────────────────────────────────
  test: {
    driver: env('TEST_DRIVER', 'bun'),
    //  'bun' | 'vitest' | 'jest'
    //  Bun's built-in test runner is the default — zero install, fastest.
  },

  // ─── Storage (runtime-aware) ──────────────────────────
  storage: {
    driver: env('STORAGE_DRIVER', 'auto'),
    //  'auto' | 'r2' | 's3' | 'cloudinary' | 'bunny' | 'local'
    //
    //  'auto' selects based on runtime:
    //    cloudflare → 'r2'
    //    bun/node   → 'local' (or 's3' if AWS keys present)
    //
    r2: {
      binding: env('R2_BINDING', 'MY_BUCKET'),
    },
    s3: {
      bucket: env('S3_BUCKET'),
      region: env('AWS_REGION', 'us-east-1'),
      accessKeyId: env('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
    },
    cloudinary: {
      cloudName: env('CLOUDINARY_CLOUD_NAME'),
      apiKey: env('CLOUDINARY_API_KEY'),
      apiSecret: env('CLOUDINARY_API_SECRET'),
    },
    bunny: {
      storageZone: env('BUNNY_STORAGE_ZONE'),
      accessKey: env('BUNNY_ACCESS_KEY'),
      cdnUrl: env('BUNNY_CDN_URL'),           // e.g. https://myzone.b-cdn.net
      region: env('BUNNY_REGION', ''),         // '' = Falkenstein, 'ny' = New York, 'sg' = Singapore
    },
    local: {
      root: './storage',
    },
  },

  // ─── Rate Limiting ────────────────────────────────────
  rateLimit: {
    auth: { windowMs: 5 * 60 * 1000, limit: 5 },
    otp: { windowMs: 10 * 60 * 1000, limit: 3 },
    api: { windowMs: 60 * 1000, limit: 100 },
  },

  // ─── Notifications ────────────────────────────────────
  notifications: {
    enabled: envBool('NOTIFICATIONS_ENABLED', true),
    //  When enabled, generates:
    //    - Drizzle schema (notifications + notification_preferences tables)
    //    - Notification service, controller, routes
    //    - Notification preferences API
    //    - Notifications page (fullstack mode only)
    //    - useNotifications composable (fullstack mode only)
    categories: ['account_billing', 'security', 'system_updates'],
    types: ['info', 'warning', 'success', 'error'],
    preferences: {
      defaultFrequency: 'realtime',  // 'realtime' | 'daily' | 'weekly'
    },
  },

  // ─── Logging / Audit Trail ────────────────────────────
  logging: {
    enabled: envBool('LOGGING_ENABLED', true),
    //  When enabled, generates:
    //    - Drizzle schema (activity_logs table)
    //    - LoggingService with log() method
    //    - Queue job for async persistence (if queue driver available)
    //    - Falls back to synchronous DB write when no queue
    driver: env('LOG_DRIVER', 'auto'),
    //  'auto' | 'queue' | 'sync'
    //
    //  'auto': uses queue if a queue driver is configured, else sync
    //  'queue': always dispatch via queue (fails if no queue driver)
    //  'sync': always write to DB synchronously
    retentionDays: envNumber('LOG_RETENTION_DAYS', 90),
  },

  // ─── Payments ─────────────────────────────────────────
  payment: {
    driver: env('PAYMENT_DRIVER', 'paystack'),
    // 'paystack' | 'stripe' | 'both'
    paystack: {
      publicKey: env('PAYSTACK_PUBLIC_KEY'),
      secretKey: env('PAYSTACK_SECRET_KEY'),
      webhookSecret: env('PAYSTACK_WEBHOOK_SECRET'),
    },
    stripe: {
      publishableKey: env('STRIPE_PUBLISHABLE_KEY'),
      secretKey: env('STRIPE_SECRET_KEY'),
      webhookSecret: env('STRIPE_WEBHOOK_SECRET'),
    },
  },

  // ─── API Docs ─────────────────────────────────────────
  docs: {
    swagger: true,       // Swagger UI at /docs
    fiberplane: true,    // Fiberplane at /fp
    openapi: '/openapi.json',
  },

  // ─── Auto-Imports ─────────────────────────────────────
  autoImport: {
    server: {
      dirs: [
        'src/shared/utils/**',
        'src/shared/middleware/**',
        'src/shared/dto/**',
        'src/lib/**',
      ],
      imports: [
        {
          'hono': ['Hono'],
          'hono/http-exception': ['HTTPException'],
          'drizzle-orm': ['eq', 'and', 'or', 'desc', 'asc', 'isNull', 'isNotNull', 'sql', 'count', 'like', 'inArray'],
          'zod': ['z'],
        },
      ],
    },
    client: {
      dirs: ['src/composables/**', 'src/stores/**'],
      imports: ['vue', 'vue-router', 'pinia'],
      vueTemplate: true,
    },
  },

  // ─── UI Theme ─────────────────────────────────────────
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc',
    },
  },
})
```

### 19.2 The `.env` File

Generated by the CLI with sensible defaults:

```bash
# .env
APP_URL=http://localhost:8787
NODE_ENV=development
APP_KEY=base64:random-generated-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Runtime
VONO_RUNTIME=cloudflare-workers
VONO_MODE=fullstack

# Database
DB_DRIVER=pg
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
# HYPERDRIVE_ID=your-id    # Uncomment for Cloudflare

# Auth
JWT_SECRET=your-secret-here
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email
MAIL_DRIVER=resend
RESEND_API_KEY=
MAIL_FROM_NAME="My App"
MAIL_FROM_ADDRESS=noreply@example.com

# Queue (auto-detected from runtime)
QUEUE_DRIVER=auto
# REDIS_URL=redis://localhost:6379        # For bun (BullMQ)
# UPSTASH_QSTASH_URL=                      # For other runtimes
# UPSTASH_QSTASH_TOKEN=
# SQS_QUEUE_URL=                           # For AWS Lambda

# Cache (Upstash works everywhere — HTTP-based, no TCP)
CACHE_DRIVER=upstash
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Storage
STORAGE_DRIVER=auto
# CLOUDINARY_CLOUD_NAME=               # For Cloudinary driver
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
# BUNNY_STORAGE_ZONE=                   # For Bunny.net driver
# BUNNY_ACCESS_KEY=
# BUNNY_CDN_URL=https://myzone.b-cdn.net
# BUNNY_REGION=                          # '' | 'ny' | 'la' | 'sg' | 'syd'

# Notifications
NOTIFICATIONS_ENABLED=true

# Logging / Audit Trail
LOGGING_ENABLED=true
LOG_DRIVER=auto
# LOG_RETENTION_DAYS=90

# Payments
PAYMENT_DRIVER=paystack
PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=
```

### 19.3 Runtime Resolution — How `auto` Works

When config values are set to `auto`, Vono reads `runtime` from config and resolves the correct implementation:

```ts
// src/shared/resolvers/queue.ts  (internal — auto-generated by Vono)
import type { VonoConfig } from '../../vono.config'

export function resolveQueueDriver(config: VonoConfig) {
  if (config.queue.driver !== 'auto') return config.queue.driver

  switch (config.runtime) {
    // Bun and Node both run as persistent processes with TCP to Redis.
    case 'bun':
    case 'node':
      return 'bullmq'

    // Cloudflare has its own native queue primitive.
    case 'cloudflare-workers':
    case 'cloudflare-pages':
      return 'cloudflare-queues'

    // AWS Lambda gets its native queue service.
    case 'aws-lambda':
      return 'sqs'

    // Everything else: Upstash QStash (HTTP-based, no TCP needed).
    // Works on serverless, edge — anywhere with fetch().
    case 'vercel':
    case 'netlify':
    case 'deno':
    case 'fastly':
      return 'upstash'

    default:
      return 'sync'  // Fallback: run jobs in-process (dev)
  }
}
```

The same pattern applies to cache, storage, and database connection strategy.

### 19.4 Runtime Decision Matrix

| Concern | Bun | Cloudflare | Node / Docker | Vercel / Netlify | AWS Lambda | Deno | Fastly |
|---|---|---|---|---|---|---|---|
| **Queue** | BullMQ + Redis | CF Queues | BullMQ + Redis | Upstash QStash | SQS | Upstash QStash | Upstash QStash |
| **Cache** | Upstash (or Redis) | Upstash (or KV) | Upstash (or Redis) | Upstash | Upstash | Upstash | Upstash |
| **Storage** | Local / S3 / Bunny | R2 | Local / S3 / Bunny | S3 / Bunny | S3 / Bunny | S3 / Bunny | — |
| **DB connection** | Direct TCP | Hyperdrive pool | Direct TCP | Neon serverless | Direct TCP | Neon serverless | Neon serverless |
| **Rate limiter** | hono-rate-limiter | hono-rate-limiter | hono-rate-limiter | Upstash ratelimit | Upstash ratelimit | Upstash ratelimit | Upstash ratelimit |
| **Cron/Schedule** | Bun.cron | CF Cron Triggers | node-cron | Vercel Cron | EventBridge | Deno.cron | — |
| **WebSocket** | Bun.serve | Durable Objects | ws | — | API Gateway WS | Deno.serve | — |
| **Testing** | bun:test ✅ | bun:test / Vitest | Vitest / Jest | Vitest | Vitest / Jest | Deno.test | Vitest |
| **Redis (TCP)** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |

### 19.5 Config Helpers

Type-safe env readers used in `vono.config.ts`:

```ts
// Built into vono package:
export function env(key: string, fallback?: string): string {
  return process.env[key] ?? fallback ?? ''
}

export function envNumber(key: string, fallback: number): number {
  const val = process.env[key]
  return val ? Number(val) : fallback
}

export function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key]
  if (!val) return fallback
  return val === 'true' || val === '1'
}

export function envRequired(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}
```

### 19.6 Accessing Config at Runtime

Config is loaded once at startup and available via Hono context:

```ts
// In any route handler or middleware:
const config = c.get('config')

if (config.mail.driver === 'resend') {
  const resend = new Resend(config.mail.resend.apiKey)
  await resend.emails.send({ ... })
}

if (config.queue.driver === 'bullmq') {
  const queue = new Queue('emails', { connection: parseRedisUrl(config.queue.bullmq.redis) })
  await queue.add('welcome-email', { to: user.email })
}
```

### 19.7 Conditional Dependencies

Vono only installs what your config needs. Change the config → run `bun vono sync` → deps update:

```bash
# If you change QUEUE_DRIVER from 'auto' to 'bullmq':
$ bun vono sync
  ✔ Added bullmq@latest, ioredis@latest
  ✔ Removed @cloudflare/workers-types (not needed for bun runtime)
  ✔ Updated package.json
```

### 19.8 Generated Deployment Files

Based on `runtime`, the CLI also generates the right deployment config:

| Runtime | Generated file | Contents |
|---|---|---|
| `cloudflare-workers` | `wrangler.jsonc` | Hyperdrive binding, KV/R2/Queue bindings, compatibility flags |
| `cloudflare-pages` | `wrangler.jsonc` | Pages-mode config with Functions |
| `bun` | `Dockerfile` | Multi-stage Bun build |
| `node` | `Dockerfile` | Multi-stage Node build |
| `vercel` | `vercel.json` | Function config + rewrites |
| `netlify` | `netlify.toml` | Functions dir + redirect rules |
| `aws-lambda` | `serverless.yml` or SAM template | Lambda handler config |
| `deno` | `deno.json` | Import map + tasks |
| `bun` | `ecosystem.config.js` | PM2 config — `interpreter: 'bun'`, fork mode, logs, restart policy |
| `node` | `ecosystem.config.js` | PM2 config — cluster mode (`instances: 'max'`), logs, restart policy |
| `docker-bun` | `Dockerfile` + `ecosystem.config.js` | Multi-stage Bun build, `pm2-runtime` entrypoint |
| `docker-node` | `Dockerfile` + `ecosystem.config.js` | Multi-stage Node build, `pm2-runtime` entrypoint |

---

## 20. Gates & Policies — Authorization

Laravel-style authorization layer. **Gates** handle simple ability checks (is this user an admin?). **Policies** handle resource-level authorization (can this user update *this* post?). Both work with routes, controllers, and middleware.

### 20.1 Defining a Policy

Each module can have a policy file. Scaffold one with:

```bash
$ bun vono make:policy posts
  ✔ Created src/modules/posts/posts.policy.ts
```

A policy is a plain class with methods named after actions. Each method receives the authenticated user and (optionally) the resource:

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Posts Policy — Authorization Rules
 *  Module:  posts
 * ──────────────────────────────────────────────────────────────
 *  Defines who can view, create, update, and delete posts.
 *  Each method receives the authenticated user and optionally
 *  the resource being acted upon.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/modules/posts/posts.policy.ts
import type { AuthAccount } from '../../types'

export class PostsPolicy {
  /** Anyone authenticated can view posts */
  view(user: AuthAccount) {
    return true
  }

  /** Only the author or an admin can update a post */
  update(user: AuthAccount, post: { authorId: string }) {
    return user.id === post.authorId || user.currentRole === 'admin'
  }

  /** Only the author or an admin can delete a post */
  delete(user: AuthAccount, post: { authorId: string }) {
    return user.id === post.authorId || user.currentRole === 'admin'
  }

  /** Only admins can force-delete (bypass soft delete) */
  forceDelete(user: AuthAccount) {
    return user.currentRole === 'admin'
  }

  /** Only verified users can create posts */
  create(user: AuthAccount) {
    return user.emailVerified === true
  }
}
```

### 20.2 Registering Policies

Policies are registered in a central `src/shared/policies/index.ts` registry:

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Policy Registry
 * ──────────────────────────────────────────────────────────────
 *  Central registry of all module policies.
 *  Auto-updated when you run: bun vono make:policy <module>
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/shared/policies/index.ts
import { PostsPolicy } from '../../modules/posts/posts.policy'
import { DomainsPolicy } from '../../modules/domains/domains.policy'
import { CampaignsPolicy } from '../../modules/campaigns/campaigns.policy'

export const policies = {
  posts: new PostsPolicy(),
  domains: new DomainsPolicy(),
  campaigns: new CampaignsPolicy(),
} as const

export type PolicyName = keyof typeof policies
```

### 20.3 Gates — Simple Ability Checks

Gates are one-off authorization checks defined centrally. Use them for actions not tied to a specific resource:

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Gates — Simple Ability Checks
 * ──────────────────────────────────────────────────────────────
 *  One-off authorization checks not tied to a specific resource.
 *  Add your gates here; use with: authorize(user, 'gate-name')
 *  or as middleware: gate('gate-name')
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/shared/gates/index.ts
import type { AuthAccount } from '../../types'

export const gates = {
  /** Only admins can access the admin panel */
  'access-admin': (user: AuthAccount) => user.currentRole === 'admin',

  /** Only users with active subscriptions can send campaigns */
  'send-campaign': (user: AuthAccount & { subscription?: { status: string } }) =>
    user.subscription?.status === 'active',

  /** Only super admins can manage payment gateways */
  'manage-gateways': (user: AuthAccount) => user.currentRole === 'super_admin',

  /** Only verified users can create API keys */
  'create-api-key': (user: AuthAccount) => user.emailVerified === true,
} as const

export type GateName = keyof typeof gates
```

### 20.4 The `authorize()` Helper

A unified helper that checks both gates and policies:

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Authorization Helpers
 * ──────────────────────────────────────────────────────────────
 *  authorize(user, ability, resource?) — throws 403 if denied
 *  can(user, ability, resource?)      — returns boolean
 *  cannot(user, ability, resource?)   — inverse of can()
 *
 *  Supports both gates (simple) and policies (resource-level).
 *  Use dot notation for policies: 'posts.update'
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/shared/utils/authorize.ts
import type { AuthAccount } from '../../types'
import { gates, type GateName } from '../gates'
import { policies, type PolicyName } from '../policies'
import { HTTPException } from 'hono/http-exception'

/**
 * Check a gate: authorize(user, 'access-admin')
 * Check a policy: authorize(user, 'posts.update', post)
 */
export function authorize(user: AuthAccount, ability: string, resource?: unknown): void {
  let allowed = false

  if (ability.includes('.')) {
    // Policy check: "posts.update"
    const [policyName, action] = ability.split('.') as [PolicyName, string]
    const policy = policies[policyName]
    if (!policy || typeof (policy as any)[action] !== 'function') {
      throw new HTTPException(500, { message: `Unknown policy action: ${ability}` })
    }
    allowed = (policy as any)[action](user, resource)
  } else {
    // Gate check: "access-admin"
    const gate = gates[ability as GateName]
    if (!gate) {
      throw new HTTPException(500, { message: `Unknown gate: ${ability}` })
    }
    allowed = gate(user)
  }

  if (!allowed) {
    throw new HTTPException(403, { message: 'This action is unauthorized.' })
  }
}

/** Non-throwing version — returns boolean */
export function can(user: AuthAccount, ability: string, resource?: unknown): boolean {
  try {
    authorize(user, ability, resource)
    return true
  } catch {
    return false
  }
}

/** Inverse of can() */
export function cannot(user: AuthAccount, ability: string, resource?: unknown): boolean {
  return !can(user, ability, resource)
}
```

### 20.5 Using in Routes — Middleware

Apply authorization as Hono middleware on individual routes or route groups:

```ts
// src/modules/posts/posts.routes.ts
import { Hono } from 'hono'
import type { AppVariables } from '../../types'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { gate, policy } from '../../shared/middleware/authorize.middleware'
import { PostsService } from './posts.service'
import { PostsController } from './posts.controller'

const postsRoutes = new Hono<{ Variables: AppVariables }>()

postsRoutes.use('*', authMiddleware)

// Gate middleware — check a simple ability before all routes in this group
// postsRoutes.use('*', gate('send-campaign'))

// Policy middleware — check before specific routes
postsRoutes.get('/', (c) => controller(c).list(c))
postsRoutes.get('/:id', (c) => controller(c).getById(c))
postsRoutes.post('/', policy('posts.create'), (c) => controller(c).create(c))
postsRoutes.put('/:id', policy('posts.update'), (c) => controller(c).update(c))
postsRoutes.delete('/:id', policy('posts.delete'), (c) => controller(c).remove(c))

export { postsRoutes }
```

The `gate()` and `policy()` middleware factories:

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Authorization Middleware
 * ──────────────────────────────────────────────────────────────
 *  Hono middleware factories for gate and policy checks.
 *  Use gate() for simple ability checks on route groups.
 *  Use policy() for resource-level checks on individual routes.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// src/shared/middleware/authorize.middleware.ts
import type { MiddlewareHandler } from 'hono'
import type { AppVariables } from '../../types'
import { authorize } from '../utils/authorize'

/** Gate middleware — checks a simple ability */
export function gate(ability: string): MiddlewareHandler<{ Variables: AppVariables }> {
  return async (c, next) => {
    const user = c.get('authAccount')
    authorize(user, ability)
    await next()
  }
}

/**
 * Policy middleware — checks a resource-level ability.
 * For routes with :id params, the resource is loaded inside the controller.
 * Use this for create-level checks (no resource needed).
 * For update/delete, call authorize() inside the controller after loading the resource.
 */
export function policy(ability: string): MiddlewareHandler<{ Variables: AppVariables }> {
  return async (c, next) => {
    const user = c.get('authAccount')
    authorize(user, ability)
    await next()
  }
}
```

### 20.6 Using in Controllers

For resource-level checks (update, delete), authorize *after* loading the resource:

```ts
// src/modules/posts/posts.controller.ts
import type { Context } from 'hono'
import type { AppVariables } from '../../types'
import { authorize } from '../../shared/utils/authorize'
import { success, error } from '../../shared/utils/response'
import type { PostsService } from './posts.service'

type AppContext = Context<{ Variables: AppVariables }>

export class PostsController {
  constructor(private service: PostsService) {}

  async update(c: AppContext) {
    const user = c.get('authAccount')
    const { id } = c.req.param()

    const post = await this.service.getById(id)
    if (!post) return c.json(error('Post not found'), 404)

    // Authorize against the actual resource
    authorize(user, 'posts.update', post)

    const body = await c.req.json()
    const updated = await this.service.update(id, body)
    return c.json(success('Post updated', updated))
  }

  async remove(c: AppContext) {
    const user = c.get('authAccount')
    const { id } = c.req.param()

    const post = await this.service.getById(id)
    if (!post) return c.json(error('Post not found'), 404)

    authorize(user, 'posts.delete', post)

    const deleted = await this.service.softDelete(id)
    return c.json(success('Post deleted', deleted))
  }
}
```

### 20.7 Gate & Policy Summary

| Concept | Purpose | Where to define | How to check |
|---|---|---|---|
| **Gate** | Simple yes/no ability (no resource) | `src/shared/gates/index.ts` | `authorize(user, 'access-admin')` / `gate('access-admin')` middleware |
| **Policy** | Resource-level authorization | `src/modules/<mod>/<mod>.policy.ts` | `authorize(user, 'posts.update', post)` / `policy('posts.create')` middleware |
| `authorize()` | Throws 403 if denied | Call in controllers or middleware | `authorize(user, ability, resource?)` |
| `can()` | Returns boolean (non-throwing) | Call in services or templates | `can(user, 'posts.update', post)` |
| `cannot()` | Inverse of `can()` | Call in services or templates | `cannot(user, 'posts.delete', post)` |

### 20.8 Scaffolding

```bash
# Create a policy for a module
$ bun vono make:policy posts
  ✔ Created src/modules/posts/posts.policy.ts
  ✔ Registered in src/shared/policies/index.ts

# Generated policy includes stubs for common actions:
# view, create, update, delete, forceDelete
```

---

## 21. Resources — API Response Transformers (Optional)

Resources transform raw database rows into clean, consistent API responses. They decouple your database schema from your public API — rename fields, compute values, nest relations, and hide internals without touching the service layer. **Resources are optional** — you can return raw data via `ApiResponse.success(data)` and add resources later when your API matures.

### 21.1 The Resource Pattern

```
Database row → Resource.toResource() → shaped JSON → ApiResponse.success()
Collection   → Resource.toCollection() → shaped JSON[] + pagination meta
```

Every resource is a plain class with two static methods:

| Method | Input | Output |
|---|---|---|
| `toResource(item)` | Single DB row / object | Shaped JSON object |
| `toCollection(items, total, page, limit)` | Array + pagination info | `{ items: [...], meta: { pagination } }` |

### 21.2 Creating a Resource

```bash
$ bun vono make:resource posts
  ✔ Created src/modules/posts/posts.resource.ts
```

**Generated `posts.resource.ts`:**

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Posts Resource — API Response Transformer
 *  Module:  posts
 * ──────────────────────────────────────────────────────────────
 *  Transforms raw database rows into clean API responses.
 *  Rename fields, compute values, nest relations, hide internals.
 *
 *  Usage (controller):
 *    return c.json(ApiResponse.success(PostsResource.toResource(post)))
 *    return c.json(ApiResponse.success(PostsResource.toCollection(posts, total, page, limit)))
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { buildPaginationMeta } from '../../shared/utils/pagination'

export class PostsResource {
  /**
   * Transform a single post into the public API shape.
   */
  static toResource(post: any) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.content?.substring(0, 160) ?? null,
      content: post.content,
      status: post.status,
      author: post.author
        ? { id: post.author.id, name: post.author.name }
        : null,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    }
  }

  /**
   * Transform a collection of posts with pagination metadata.
   */
  static toCollection(
    posts: any[],
    total: number,
    page: number,
    limit: number,
  ) {
    return {
      items: posts.map((p) => this.toResource(p)),
      meta: buildPaginationMeta({ page, limit, total }),
    }
  }
}
```

### 21.3 Using Resources in Controllers

Resources sit between the service and the response — the controller calls the service, passes raw data to the resource, then wraps it in `ApiResponse`:

```ts
// src/modules/posts/posts.controller.ts
import { ApiResponse } from '../../shared/utils/response'
import { PostsResource } from './posts.resource'
import type { PostsService } from './posts.service'

export class PostsController {
  constructor(private service: PostsService) {}

  async list(c: AppContext) {
    const query = c.req.query()
    const { items, total, page, limit } = await this.service.list(query)

    // With resource (transform raw DB rows → clean API shape)
    return c.json(ApiResponse.success(
      PostsResource.toCollection(items, total, page, limit),
      'Posts loaded',
    ))
  }

  async getById(c: AppContext) {
    const { id } = c.req.param()
    const post = await this.service.getById(id)
    if (!post) return c.json(ApiResponse.failure('Post not found'), 404)

    return c.json(ApiResponse.success(
      PostsResource.toResource(post),
      'Post loaded',
    ))
  }

  // Without resource (quick — return raw data directly)
  async create(c: AppContext) {
    const body = await c.req.json()
    const post = await this.service.create(body)
    return c.json(ApiResponse.success(post, 'Post created'), 201)
  }
}
```

### 21.4 Advanced — Field Selection

Allow the API consumer to request only specific fields:

```ts
export class PostsResource {
  static toResource(post: any, fields?: string[]) {
    const resource = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      author: post.author
        ? { id: post.author.id, name: post.author.name }
        : null,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    }

    // If ?fields=id,title,slug is passed, return only those keys
    if (fields?.length) {
      return Object.fromEntries(
        Object.entries(resource).filter(([key]) => fields.includes(key)),
      )
    }
    return resource
  }
}

// Controller usage:
const fields = c.req.query('fields')?.split(',')
return c.json(ApiResponse.success(PostsResource.toResource(post, fields)))
```

### 21.5 Advanced — Nested Resources

Resources can compose other resources for related data:

```ts
// src/modules/bookings/bookings.resource.ts
import { HotelsResource } from '../hotels/hotels.resource'
import { CustomersResource } from '../customers/customers.resource'

export class BookingsResource {
  static toResource(booking: any) {
    return {
      id: booking.id,
      reference: booking.reference,
      amount: booking.amount,
      status: booking.status,
      checked_in: booking.checkedIn,
      checked_out: booking.checkedOut,
      customer: booking.customer
        ? CustomersResource.toResource(booking.customer)
        : null,
      hotel: booking.hotel
        ? HotelsResource.toResource(booking.hotel)
        : null,
    }
  }

  static toCollection(bookings: any[], total: number, page: number, limit: number) {
    return {
      items: bookings.map((b) => this.toResource(b)),
      meta: buildPaginationMeta({ page, limit, total }),
    }
  }
}
```

### 21.6 File Storage — Combining with Resources

When a module uses file uploads (Cloudinary, R2, S3, local), the resource is the right place to transform stored paths into full URLs:

```ts
// src/modules/users/users.resource.ts
import { resolveStorageUrl } from '../../shared/utils/storage'

export class UsersResource {
  static toResource(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatarPath
        ? resolveStorageUrl(user.avatarPath)  // '/avatars/abc.webp' → full URL
        : null,
    }
  }
}
```

```ts
// src/shared/utils/storage.ts
import type { VonoConfig } from '../../vono.config'

export function resolveStorageUrl(path: string, config?: VonoConfig): string {
  const driver = config?.storage.driver ?? 'local'

  switch (driver) {
    case 'cloudinary':
      // Cloudinary paths are already full URLs
      return path.startsWith('http') ? path : `https://res.cloudinary.com/${config?.storage.cloudinary?.cloudName}/image/upload/${path}`
    case 'r2':
      return `${config?.storage.r2?.publicUrl ?? ''}/${path}`
    case 's3':
      return `https://${config?.storage.s3?.bucket}.s3.${config?.storage.s3?.region}.amazonaws.com/${path}`
    case 'local':
    default:
      return `/storage/${path}`
  }
}
```

### 21.7 Resource Summary

| Concept | Purpose | Convention |
|---|---|---|
| `XyzResource.toResource(item)` | Shape a single item for public API | `src/modules/<mod>/<mod>.resource.ts` |
| `XyzResource.toCollection(items, total, page, limit)` | Shape array + pagination meta | Same file — both methods |
| Field selection | `?fields=id,title` → return only requested keys | Optional — pass `fields` param to `toResource` |
| Nested resources | Compose child resources | Import other `XyzResource` classes |
| Storage URLs | Transform stored paths → full public URLs | `resolveStorageUrl()` in shared utils |

---

## 22. PM2 Deployment — Process Management

PM2 is the standard production process manager for **Bun** and **Node.js** deployments. When the wizard target is Bun, Node.js, Docker (Bun), or Docker (Node), Vono auto-generates an `ecosystem.config.js` tailored to the chosen runtime. For serverless/edge targets (Cloudflare, Vercel, Netlify, Lambda, Deno, Fastly) PM2 is not applicable — those runtimes handle process lifecycle natively.

### 22.1 When PM2 is Generated

| Target | PM2 generated? | Why |
|---|---|---|
| **Bun** | ✅ | Persistent process — needs reload, clustering, log management |
| **Node.js** | ✅ | Same — classic PM2 use case |
| **Docker (Bun)** | ✅ | Container entrypoint via PM2 for graceful reloads |
| **Docker (Node)** | ✅ | Same — PM2 handles process inside container |
| Cloudflare Workers / Pages | ❌ | Managed by Cloudflare |
| Vercel / Netlify | ❌ | Serverless — managed by platform |
| AWS Lambda | ❌ | Serverless — managed by AWS |
| Deno | ❌ | Deno has built-in watch + deploy |
| Fastly | ❌ | Edge compute — managed by Fastly |

### 22.2 Auto-Generated `ecosystem.config.js`

The CLI generates the config based on the runtime selection. The key difference is the `interpreter` field — Bun uses the `bun` binary, Node uses the default `node`.

#### Bun runtime

```js
/**
 * ──────────────────────────────────────────────────────────────
 *  PM2 Ecosystem Config — Bun Runtime
 *  Auto-generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 *  Start:   pm2 start ecosystem.config.js
 *  Reload:  pm2 reload my-app
 *  Logs:    pm2 logs my-app
 *  Monitor: pm2 monit
 * ──────────────────────────────────────────────────────────────
 */

module.exports = {
  apps: [
    {
      name: 'my-app',
      script: './dist/index.js',
      interpreter: 'bun',              // ← Bun as the runtime interpreter
      instances: 1,                     // Bun has built-in multi-threading; 1 is usually enough
      exec_mode: 'fork',               // Bun doesn't use Node's cluster module
      watch: false,                     // Disable in production — use pm2 reload
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 8787,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8787,
      },

      // ─── Logs ────────────────────────────────────────
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,              // No PID suffix on log files

      // ─── Control ─────────────────────────────────────
      min_uptime: '10s',               // App must run 10s to be "started"
      max_restarts: 10,                // Max consecutive crashes before stop
      restart_delay: 4000,             // Wait 4s between restart attempts
      kill_timeout: 5000,              // 5s grace period on SIGINT before SIGKILL
      wait_ready: false,               // Set true if app sends process.send('ready')
      autorestart: true,               // Auto-restart on crash
    },
  ],
}
```

#### Node.js runtime

```js
/**
 * ──────────────────────────────────────────────────────────────
 *  PM2 Ecosystem Config — Node.js Runtime
 *  Auto-generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 *  Start:   pm2 start ecosystem.config.js
 *  Reload:  pm2 reload my-app
 *  Logs:    pm2 logs my-app
 *  Monitor: pm2 monit
 * ──────────────────────────────────────────────────────────────
 */

module.exports = {
  apps: [
    {
      name: 'my-app',
      script: './dist/index.js',
      // interpreter defaults to 'node' — no need to specify
      instances: 'max',                // Cluster mode: one process per CPU core
      exec_mode: 'cluster',            // Node.js cluster module for load balancing
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 8787,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8787,
      },

      // ─── Logs ────────────────────────────────────────
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,

      // ─── Control ─────────────────────────────────────
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: false,
      autorestart: true,
    },
  ],
}
```

### 22.3 Why Bun Uses `fork` and Node Uses `cluster`

| | Bun | Node.js |
|---|---|---|
| **`exec_mode`** | `fork` | `cluster` |
| **`instances`** | `1` | `'max'` (one per CPU) |
| **`interpreter`** | `'bun'` | (default `node`) |
| **Why** | Bun has built-in multi-threading via `Bun.serve()` — a single process handles concurrency efficiently. PM2 cluster mode relies on Node's `cluster` module which Bun doesn't implement. | Node.js is single-threaded by default. PM2 cluster mode spawns one worker per CPU and load-balances incoming connections using the OS. |

### 22.4 Docker Integration

When the target is Docker (Bun) or Docker (Node), the generated `Dockerfile` uses PM2 as the entrypoint:

```dockerfile
# ──────────────────────────────────────────────────────────────
#  Dockerfile — Bun Runtime with PM2
#  Auto-generated by Vono CLI — https://vono.dev
# ──────────────────────────────────────────────────────────────

# --- Build stage ---
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# --- Production stage ---
FROM oven/bun:1-slim
WORKDIR /app
RUN bun add -g pm2
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json .
COPY --from=build /app/ecosystem.config.js .
RUN bun install --production --frozen-lockfile
RUN mkdir -p logs

EXPOSE 8787
CMD ["pm2-runtime", "ecosystem.config.js"]
```

```dockerfile
# ──────────────────────────────────────────────────────────────
#  Dockerfile — Node.js Runtime with PM2
#  Auto-generated by Vono CLI — https://vono.dev
# ──────────────────────────────────────────────────────────────

# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# --- Production stage ---
FROM node:22-alpine
WORKDIR /app
RUN npm install -g pm2
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json .
COPY --from=build /app/ecosystem.config.js .
RUN npm ci --omit=dev
RUN mkdir -p logs

EXPOSE 8787
CMD ["pm2-runtime", "ecosystem.config.js"]
```

> **`pm2-runtime`** (not `pm2 start`) is used inside Docker containers. It keeps the process in the foreground so Docker can track it. Regular `pm2 start` daemonizes, which would cause the container to exit immediately.

### 22.5 Production Commands

```bash
# ─── Start / Reload / Stop ──────────────────────────────────
pm2 start ecosystem.config.js              # Start all apps in config
pm2 start ecosystem.config.js --env production  # Start with production env vars
pm2 reload my-app                          # 0-downtime reload (graceful)
pm2 restart my-app                         # Hard restart (kills + restarts)
pm2 stop my-app                            # Stop the app
pm2 delete my-app                          # Remove from PM2 process list

# ─── Monitoring ─────────────────────────────────────────────
pm2 list                                   # Status of all managed processes
pm2 logs my-app                            # Stream live logs
pm2 logs my-app --lines 200               # View last 200 log lines
pm2 monit                                  # Terminal-based dashboard

# ─── Startup / Persistence ──────────────────────────────────
pm2 startup                                # Generate OS startup script (systemd / launchd)
pm2 save                                   # Freeze current process list for auto-respawn on reboot
pm2 unstartup                              # Remove startup script

# ─── Scaling (Node.js cluster mode only) ────────────────────
pm2 scale my-app 4                         # Set to exactly 4 workers
pm2 scale my-app +2                        # Add 2 more workers

# ─── Environments ───────────────────────────────────────────
pm2 start ecosystem.config.js --env development   # Use env_development vars
pm2 restart ecosystem.config.js --env production  # Switch to env_production vars
```

### 22.6 Graceful Shutdown

Vono's generated server entry handles PM2's graceful shutdown signal:

```ts
// src/index.ts — generated entrypoint handles SIGINT for graceful shutdown
process.on('SIGINT', async () => {
  // Close database connections, flush queues, etc.
  console.log('Received SIGINT — shutting down gracefully...')
  await db.$client.end?.()   // Close DB pool
  process.exit(0)
})
```

PM2 sends `SIGINT` first, waits `kill_timeout` (5000ms default), then sends `SIGKILL` if the process hasn't exited. Design your shutdown handler to complete within that window.

### 22.7 Config Attribute Reference

All attributes used in the generated config, per [PM2 official docs](https://pm2.keymetrics.io/docs/usage/application-declaration/):

| Attribute | Type | Purpose |
|---|---|---|
| `name` | string | Application name — used in `pm2 reload <name>` |
| `script` | string | Path to the entry file (relative to PM2 start) |
| `interpreter` | string | Runtime binary — `'bun'` or omit for Node default |
| `instances` | number / `'max'` | Number of processes — `'max'` = one per CPU, `0` = same as max |
| `exec_mode` | `'cluster'` / `'fork'` | `cluster` for Node.js load balancing, `fork` for Bun |
| `watch` | boolean | Auto-restart on file changes — **disable in production** |
| `max_memory_restart` | string | Restart if memory exceeds this (`'512M'`, `'1G'`) |
| `env` | object | Default environment variables |
| `env_<name>` | object | Environment-specific vars, selected with `--env <name>` |
| `error_file` | string | Path for error log output |
| `out_file` | string | Path for stdout log output |
| `log_date_format` | string | Timestamp format for log lines |
| `combine_logs` | boolean | Merge logs from all instances into one file (no PID suffix) |
| `min_uptime` | string/number | Minimum uptime to consider the app "started" |
| `max_restarts` | number | Max consecutive crash restarts before giving up |
| `restart_delay` | number | Delay (ms) between restart attempts |
| `kill_timeout` | number | Grace period (ms) before SIGKILL after SIGINT |
| `wait_ready` | boolean | Wait for `process.send('ready')` instead of listen event |
| `autorestart` | boolean | Auto-restart on crash (default: true) |

---

## 23. WebSocket & Real-Time

Vono supports two WebSocket approaches: **Hono WebSocket** (built-in, lightweight, works everywhere) and **Socket.IO** (richer API with rooms, namespaces, auto-reconnect — Bun/Node only). The wizard asks which to use; the CLI generates the right server + client code.

### 23.1 Runtime Compatibility Matrix

| Runtime | Hono WebSocket | Socket.IO | Notes |
|---|---|---|---|
| **Bun** | ✅ `hono/bun` | ✅ `@socket.io/bun-engine` | Both work natively |
| **Node.js** | ✅ `@hono/node-ws` | ✅ `socket.io` | Node WS via `@hono/node-ws` middleware |
| **Cloudflare Workers** | ✅ `hono/cloudflare-workers` | ❌ | CF uses Durable Objects for stateful WS |
| **Cloudflare Pages** | ✅ `hono/cloudflare-workers` | ❌ | Same as Workers |
| **Deno** | ✅ `hono/deno` | ❌ | Deno.serve has native WS |
| **Docker (Bun)** | ✅ | ✅ | Same as Bun |
| **Docker (Node)** | ✅ | ✅ | Same as Node |
| **Vercel / Netlify** | ❌ | ❌ | Serverless — no persistent connections |
| **AWS Lambda** | ❌ (use API Gateway WS) | ❌ | Serverless — use AWS API Gateway WebSocket |
| **Fastly** | ❌ | ❌ | Edge compute — no WS support |

> **Socket.IO is only available when the target is Bun, Node, Docker (Bun), or Docker (Node).** If the user selects a serverless/edge target and picks Socket.IO, the wizard falls back to Hono WebSocket with a warning.

### 23.2 Hono WebSocket — Built-in (All Runtimes)

Hono's `upgradeWebSocket()` helper provides a simple, cross-runtime WebSocket API. Import path varies by runtime — Vono auto-selects the correct one based on the `runtime` config.

#### Server setup

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  WebSocket Module — Hono Built-in
 *  Path:  src/modules/ws/ws.routes.ts
 * ──────────────────────────────────────────────────────────────
 *  Cross-runtime WebSocket using Hono's upgradeWebSocket() helper.
 *  Works on Bun, Node (@hono/node-ws), Cloudflare Workers, and Deno.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { Hono } from 'hono'

// Import is auto-resolved by Vono based on your runtime config:
//   bun             → import { upgradeWebSocket, websocket } from 'hono/bun'
//   node            → import { createNodeWebSocket } from '@hono/node-ws'
//   cloudflare      → import { upgradeWebSocket } from 'hono/cloudflare-workers'
//   deno            → import { upgradeWebSocket } from 'hono/deno'
import { upgradeWebSocket } from '@@ws-adapter'  // alias resolved at build time

const wsRoutes = new Hono()

// ─── WebSocket endpoint ─────────────────────────────────────
wsRoutes.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onOpen(event, ws) {
        console.log('Client connected')
        ws.send(JSON.stringify({ type: 'connected', message: 'Welcome!' }))
      },

      onMessage(event, ws) {
        const data = JSON.parse(event.data as string)
        console.log('Received:', data)

        // Echo back or handle custom events
        ws.send(JSON.stringify({ type: 'echo', data }))
      },

      onClose(event, ws) {
        console.log('Client disconnected')
      },

      onError(event, ws) {
        console.error('WebSocket error:', event)
      },
    }
  }),
)

export { wsRoutes }
```

#### Bun entry point (auto-generated)

```ts
// src/index.ts — Bun runtime with WebSocket
import { Hono } from 'hono'
import { websocket } from 'hono/bun'
import app from './app'

export default {
  port: Number(process.env.PORT ?? 8787),
  fetch: app.fetch,
  websocket,  // Required: Bun needs this export for WS upgrade
}
```

#### Node.js entry point (auto-generated)

```ts
// src/index.ts — Node.js runtime with WebSocket
import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import app from './app'

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

// Register WS routes using the Node adapter's upgradeWebSocket
// (Vono auto-wires this — your route files use the same API)

const server = serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 8787) })
injectWebSocket(server)

console.log(`Server running on port ${process.env.PORT ?? 8787}`)
```

#### Cloudflare Workers (Durable Objects)

```ts
// src/index.ts — Cloudflare Workers with WebSocket
import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/cloudflare-workers'

const app = new Hono()

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        ws.send(`Echo: ${event.data}`)
      },
      onClose() {
        console.log('Connection closed')
      },
    }
  }),
)

export default app
```

#### Client connection (Vue composable)

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  useWebSocket — Hono WebSocket Client Composable
 *  Path:  src/shared/composables/useWebSocket.ts
 * ──────────────────────────────────────────────────────────────
 *  Reactive WebSocket connection with auto-reconnect.
 *  Uses the native browser WebSocket API — no extra library needed.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

export function useWebSocket(path = '/ws') {
  const ws = ref<WebSocket | null>(null)
  const messages = ref<any[]>([])
  const isConnected = ref(false)
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}${path}`

    ws.value = new WebSocket(url)

    ws.value.onopen = () => {
      isConnected.value = true
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    }

    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      messages.value.push(data)
    }

    ws.value.onclose = () => {
      isConnected.value = false
      // Auto-reconnect after 3 seconds
      reconnectTimer = setTimeout(() => connect(), 3000)
    }

    ws.value.onerror = (err) => {
      console.error('WebSocket error:', err)
      ws.value?.close()
    }
  }

  function send(data: any) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    }
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    ws.value?.close()
    ws.value = null
    isConnected.value = false
  }

  onMounted(() => connect())
  onUnmounted(() => disconnect())

  return { ws, messages, isConnected, send, disconnect, connect }
}
```

#### RPC mode (type-safe client via Hono)

Hono WebSocket supports full RPC type inference:

```ts
// index.ts
const wsApp = app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        ws.send(`Echo: ${event.data}`)
      },
    }
  }),
)

export type WebSocketApp = typeof wsApp

// client.ts — type-safe WebSocket connection
import { hc } from 'hono/client'
import type { WebSocketApp } from './server'

const client = hc<WebSocketApp>('http://localhost:8787')
const socket = client.ws.$ws()  // Returns a typed WebSocket
```

### 23.3 Socket.IO — Rich Real-Time (Bun / Node Only)

Socket.IO provides rooms, namespaces, auto-reconnect, binary support, and fallback polling. **Only available on Bun and Node.js runtimes** — it requires a persistent server process.

#### Bun + Hono + Socket.IO

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Socket.IO Server — Bun Runtime
 *  Path:  src/shared/ws/socket.ts
 * ──────────────────────────────────────────────────────────────
 *  Socket.IO integration using @socket.io/bun-engine.
 *  Runs alongside Hono on the same port — no separate WS server needed.
 *
 *  Reference: https://socket.io/docs/v4/server-initialization/#with-hono--bun
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { Server as Engine } from '@socket.io/bun-engine'
import { Server } from 'socket.io'

const io = new Server({
  cors: { origin: ['*'] },  // Configure per your domain
})

const engine = new Engine()
io.bind(engine)

const { websocket } = engine.handler()

// ─── Event handlers ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Join room example
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-joined', { userId: socket.id })
  })

  // Broadcast to room
  socket.on('message', (data: { room: string; content: string }) => {
    io.to(data.room).emit('message', {
      from: socket.id,
      content: data.content,
      timestamp: Date.now(),
    })
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

export { io, engine, websocket }
```

```ts
// src/index.ts — Bun entry point with Socket.IO
import { Hono } from 'hono'
import { engine, websocket } from './shared/ws/socket'

const app = new Hono()
// ... mount routes ...

export default {
  port: Number(process.env.PORT ?? 8787),
  idleTimeout: 30,  // Must be > Socket.IO pingInterval (25s default)
  fetch(req: Request, server: any) {
    const url = new URL(req.url)
    if (url.pathname === '/socket.io/') {
      return engine.handleRequest(req, server)
    }
    return app.fetch(req, server)
  },
  websocket,
}
```

#### Node.js + Hono + Socket.IO

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Socket.IO Server — Node.js Runtime
 *  Path:  src/shared/ws/socket.ts
 * ──────────────────────────────────────────────────────────────
 *  Socket.IO integration with @hono/node-server.
 *  The HTTP server from `serve()` is passed to Socket.IO.
 *
 *  Reference: https://socket.io/docs/v4/server-initialization/#with-hono-nodejs
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { Server } from 'socket.io'

let io: Server

export function createSocketServer(httpServer: any) {
  io = new Server(httpServer, {
    cors: { origin: ['*'] },
  })

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId)
      socket.to(roomId).emit('user-joined', { userId: socket.id })
    })

    socket.on('message', (data: { room: string; content: string }) => {
      io.to(data.room).emit('message', {
        from: socket.id,
        content: data.content,
        timestamp: Date.now(),
      })
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })

  return io
}

export { io }
```

```ts
// src/index.ts — Node.js entry point with Socket.IO
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createSocketServer } from './shared/ws/socket'

const app = new Hono()
// ... mount routes ...

const httpServer = serve({
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 8787),
})

// Attach Socket.IO to the same HTTP server
const io = createSocketServer(httpServer)

console.log(`Server running on port ${process.env.PORT ?? 8787}`)
```

#### Vue Client — Socket.IO composable

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  useSocket — Socket.IO Client Composable
 *  Path:  src/shared/composables/useSocket.ts
 * ──────────────────────────────────────────────────────────────
 *  Reactive Socket.IO client with auto-connect and typed events.
 *  Requires: `socket.io-client` (auto-installed by Vono).
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { io as ioClient, type Socket } from 'socket.io-client'

export function useSocket(namespace = '/') {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)

  function connect() {
    const url = window.location.origin + namespace
    socket.value = ioClient(url, {
      transports: ['websocket'],    // Skip long-polling, go straight to WS
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    socket.value.on('connect', () => {
      isConnected.value = true
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
    })
  }

  function emit(event: string, data?: any) {
    socket.value?.emit(event, data)
  }

  function on(event: string, handler: (...args: any[]) => void) {
    socket.value?.on(event, handler)
  }

  function off(event: string, handler?: (...args: any[]) => void) {
    socket.value?.off(event, handler)
  }

  function joinRoom(roomId: string) {
    socket.value?.emit('join-room', roomId)
  }

  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
    isConnected.value = false
  }

  onMounted(() => connect())
  onUnmounted(() => disconnect())

  return { socket, isConnected, emit, on, off, joinRoom, disconnect, connect }
}
```

#### Usage in a Vue page

```vue
<!-- src/modules/chat/index.page.vue -->
<script setup lang="ts">
const { isConnected, emit, on, joinRoom } = useSocket()

const messages = ref<{ from: string; content: string; timestamp: number }[]>([])
const newMessage = ref('')
const roomId = 'general'

onMounted(() => {
  joinRoom(roomId)

  on('message', (msg) => {
    messages.value.push(msg)
  })

  on('user-joined', ({ userId }) => {
    messages.value.push({ from: 'system', content: `${userId} joined`, timestamp: Date.now() })
  })
})

function sendMessage() {
  if (!newMessage.value.trim()) return
  emit('message', { room: roomId, content: newMessage.value })
  newMessage.value = ''
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <div class="flex items-center gap-2 p-4 border-b">
      <div :class="isConnected ? 'bg-green-500' : 'bg-red-500'" class="size-2 rounded-full" />
      <span class="text-sm text-muted">{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      <div v-for="(msg, i) in messages" :key="i" class="text-sm">
        <span class="font-medium">{{ msg.from }}:</span> {{ msg.content }}
      </div>
    </div>

    <form @submit.prevent="sendMessage" class="p-4 border-t flex gap-2">
      <UInput v-model="newMessage" placeholder="Type a message..." class="flex-1" />
      <UButton type="submit" label="Send" />
    </form>
  </div>
</template>
```

### 23.4 Vono Config — WebSocket

```ts
// vono.config.ts — WebSocket section
export default defineVonoConfig({
  // ... other config ...

  // ─── Real-Time / WebSocket ──────────────────────────────────
  ws: {
    driver: env('WS_DRIVER', 'none'),
    //  'none' | 'hono' | 'socket.io'
    //
    //  'hono'      → Hono's built-in upgradeWebSocket() — works on all runtimes
    //  'socket.io' → Socket.IO with rooms, namespaces — Bun/Node only
    //  'none'      → No WebSocket support (default)
    //
    socketio: {
      cors: {
        origin: env('WS_CORS_ORIGIN', '*'),
      },
    },
  },
})
```

### 23.5 WebSocket Summary

| Feature | Hono WebSocket | Socket.IO |
|---|---|---|
| **Runtimes** | All (Bun, Node, CF, Deno) | Bun + Node only |
| **Install** | — (built into `hono`) | `socket.io` + engine adapter |
| **Client** | Native `WebSocket` API | `socket.io-client` |
| **Rooms** | Manual (track connections yourself) | Built-in (`socket.join()`) |
| **Namespaces** | ❌ | ✅ |
| **Auto-reconnect** | Manual (composable handles it) | Built-in |
| **Binary data** | ✅ | ✅ |
| **Fallback polling** | ❌ (WS only) | ✅ (long-polling → WS upgrade) |
| **RPC type safety** | ✅ (via `hc<>()`) | ❌ (use typed events manually) |
| **Best for** | Simple real-time, edge runtimes | Chat, notifications, complex rooms |

---

## 24. Auth Scaffolding — Pages, APIs & Composables

When **auth is selected** in the wizard (any option except "No auth"), Vono auto-generates a complete authentication system: API routes, controllers, services, **frontend pages**, composables, middleware, and a dashboard layout. This gives you a working login → register → forgot password → reset password → dashboard → profile flow out of the box.

### 24.1 What Gets Generated

| Auth choice | API routes | Pages (full-stack only) | Composables | Middleware |
|---|---|---|---|---|
| **Email + Password** | login, register, logout, refresh, forgot-password, reset-password, profile, update-password | login, register, forgot-password, reset-password, dashboard/index, dashboard/profile | `useAuth`, `useProfile`, `useFormErrors` | `auth.global` (route guard) |
| **+ Google OAuth** | Above + `/auth/google`, `/auth/google/callback` | Above + auth/callback | Above | Above |
| **+ GitHub OAuth** | Above + `/auth/github`, `/auth/github/callback` | Above + auth/callback | Above | Above |
| **+ Google + GitHub** | All of the above | All of the above | Above | Above |

### 24.2 Generated File Tree

```
src/
  modules/
    auth/
      auth.routes.ts          # API routes (login, register, etc.)
      auth.controller.ts      # Request handling
      auth.service.ts         # JWT, hashing, OTP logic
      auth.dto.ts             # Zod schemas for all auth endpoints
      auth.schema.ts          # Drizzle users table + sessions
      login.page.vue          # Login page
      register.page.vue       # Registration page
      forgot-password.page.vue # OTP request page
      reset-password.page.vue  # New password page
      auth/
        callback.page.vue     # OAuth callback (if OAuth selected)
      composables/
        useAuth.ts            # JWT token management, login/register/logout
        useProfile.ts         # Profile fetch/update, password change
        useFormErrors.ts      # Field-level error extraction from API
  shared/
    middleware/
      auth.middleware.ts      # Server-side JWT verification
    layouts/
      dashboard.vue           # Sidebar + topbar layout
  modules/
    dashboard/
      index.page.vue          # Dashboard home
      profile.page.vue        # Profile & security page
```

### 24.3 Generated Auth API Routes

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Auth Routes
 *  Module:  auth
 *  Path:    /api/v1/auth
 * ──────────────────────────────────────────────────────────────
 *  Handles registration, login, logout, token refresh,
 *  password reset (OTP), and OAuth callbacks.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { Hono } from 'hono'
import type { AppVariables } from '../../types'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { zValidator } from '../../shared/validators/validator-wrapper'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import {
  RegisterDto, LoginDto, ForgotPasswordDto,
  ResetPasswordDto, UpdatePasswordDto, UpdateProfileDto,
} from './auth.dto'

const authRoutes = new Hono<{ Variables: AppVariables }>()

// ─── Service/Controller injection ───────────────────────────
authRoutes.use('*', async (c, next) => {
  const service = new AuthService(c.get('db'), c.get('config'))
  c.set('authController', new AuthController(service))
  await next()
})

// ─── Public routes ──────────────────────────────────────────
authRoutes.post('/register',        zValidator('json', RegisterDto),       (c) => c.get('authController').register(c))
authRoutes.post('/login',           zValidator('json', LoginDto),          (c) => c.get('authController').login(c))
authRoutes.post('/forgot-password', zValidator('json', ForgotPasswordDto), (c) => c.get('authController').forgotPassword(c))
authRoutes.post('/reset-password',  zValidator('json', ResetPasswordDto),  (c) => c.get('authController').resetPassword(c))
authRoutes.post('/refresh',                                                (c) => c.get('authController').refresh(c))

// ─── Protected routes ───────────────────────────────────────
authRoutes.use('/me/*', authMiddleware)
authRoutes.use('/logout', authMiddleware)

authRoutes.post('/logout',          (c) => c.get('authController').logout(c))
authRoutes.get('/me',               (c) => c.get('authController').profile(c))
authRoutes.patch('/me',             zValidator('json', UpdateProfileDto),   (c) => c.get('authController').updateProfile(c))
authRoutes.patch('/me/password',    zValidator('json', UpdatePasswordDto),  (c) => c.get('authController').updatePassword(c))

// ─── OAuth routes (generated only if Google/GitHub selected) ─
// authRoutes.get('/google',          (c) => c.get('authController').googleRedirect(c))
// authRoutes.get('/google/callback', (c) => c.get('authController').googleCallback(c))
// authRoutes.get('/github',          (c) => c.get('authController').githubRedirect(c))
// authRoutes.get('/github/callback', (c) => c.get('authController').githubCallback(c))

export { authRoutes }
```

### 24.4 Generated Auth DTOs

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Auth DTOs — Zod Validation Schemas
 *  Module:  auth
 * ──────────────────────────────────────────────────────────────
 *  Validates request bodies before they reach the controller.
 *  Used with zValidator('json', SchemaName) in routes.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { z } from 'zod'

export const RegisterDto = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const LoginDto = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const ForgotPasswordDto = z.object({
  email: z.string().email('Invalid email'),
})

export const ResetPasswordDto = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const UpdatePasswordDto = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const UpdateProfileDto = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
})

export type RegisterDtoType = z.infer<typeof RegisterDto>
export type LoginDtoType = z.infer<typeof LoginDto>
```

### 24.5 Generated Login Page

```vue
<!--
  ──────────────────────────────────────────────────────────────
   Login Page
   Module:  auth
   Route:   /login  (file-based: login.page.vue)
  ──────────────────────────────────────────────────────────────
   Supports Email + Password login with optional
   Google/GitHub OAuth buttons (generated only if selected).

   Generated by Vono CLI — https://vono.dev
  ──────────────────────────────────────────────────────────────
-->

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePage({ meta: { auth: false } })

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined,
})

const toast = useToast()
const route = useRoute()
const { login, loginWithGoogle, loginWithGithub } = useAuth()

const showPassword = ref(false)
const isLoading = ref(false)
const { fieldErrors, applyApiError, clearErrors } = useFormErrors<'email' | 'password'>()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  clearErrors()
  isLoading.value = true
  try {
    await login(event.data.email, event.data.password)
    toast.add({ title: 'Welcome back!', description: 'You are now signed in.', color: 'success' })
    const redirect = (route.query.redirect as string) || '/dashboard'
    await navigateTo(redirect)
  } catch (err: any) {
    if (!applyApiError(err)) {
      toast.add({ title: 'Sign in failed', description: err?.message || 'Invalid email or password.', color: 'error' })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">Welcome back</h1>
          <p class="text-sm text-muted mt-1">Sign in to your account</p>
        </div>
      </template>

      <!-- OAuth buttons (generated if Google/GitHub selected) -->
      <!-- <div class="flex flex-col gap-2 mb-4">
        <UButton block variant="outline" icon="i-simple-icons-google" label="Continue with Google" @click="loginWithGoogle" />
        <UButton block variant="outline" icon="i-simple-icons-github" label="Continue with GitHub" @click="loginWithGithub" />
      </div>
      <UDivider label="or" class="mb-4" /> -->

      <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Email" name="email" :error="fieldErrors.email">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" icon="i-lucide-mail" />
        </UFormField>

        <UFormField label="Password" name="password" :error="fieldErrors.password">
          <UInput v-model="state.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••">
            <template #trailing>
              <UButton variant="ghost" size="xs" :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="showPassword = !showPassword" />
            </template>
          </UInput>
        </UFormField>

        <div class="flex justify-end">
          <NuxtLink to="/forgot-password" class="text-sm text-primary hover:underline">Forgot password?</NuxtLink>
        </div>

        <UButton type="submit" block :loading="isLoading" label="Sign in" />
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-muted">
          Don't have an account?
          <NuxtLink to="/register" class="text-primary font-medium hover:underline">Sign up</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
```

### 24.6 Generated Register Page

```vue
<!--
  ──────────────────────────────────────────────────────────────
   Register Page
   Module:  auth
   Route:   /register  (file-based: register.page.vue)
  ──────────────────────────────────────────────────────────────
   Generated by Vono CLI — https://vono.dev
  ──────────────────────────────────────────────────────────────
-->

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePage({ meta: { auth: false } })

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined,
  password: undefined,
  confirmPassword: undefined,
})

const termsAccepted = ref(false)
const toast = useToast()
const { register, loginWithGoogle, loginWithGithub } = useAuth()

const showPassword = ref(false)
const isLoading = ref(false)
const { fieldErrors, applyApiError, clearErrors } = useFormErrors<'name' | 'email' | 'password' | 'confirmPassword'>()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!termsAccepted.value) {
    toast.add({ title: 'Terms not accepted', description: 'You must agree to the Terms of Service.', color: 'error' })
    return
  }
  clearErrors()
  isLoading.value = true
  try {
    await register(event.data.email, event.data.password, event.data.name)
    toast.add({ title: 'Account created!', description: 'Welcome aboard.', color: 'success' })
    await navigateTo('/dashboard')
  } catch (err: any) {
    if (!applyApiError(err)) {
      toast.add({ title: 'Registration failed', description: err?.message || 'Could not create account.', color: 'error' })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">Create your account</h1>
          <p class="text-sm text-muted mt-1">Get started in seconds</p>
        </div>
      </template>

      <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Name" name="name" :error="fieldErrors.name">
          <UInput v-model="state.name" placeholder="Your name" icon="i-lucide-user" />
        </UFormField>

        <UFormField label="Email" name="email" :error="fieldErrors.email">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" icon="i-lucide-mail" />
        </UFormField>

        <UFormField label="Password" name="password" :error="fieldErrors.password">
          <UInput v-model="state.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••">
            <template #trailing>
              <UButton variant="ghost" size="xs" :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="showPassword = !showPassword" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Confirm password" name="confirmPassword" :error="fieldErrors.confirmPassword">
          <UInput v-model="state.confirmPassword" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" />
        </UFormField>

        <UCheckbox v-model="termsAccepted" label="I agree to the Terms of Service and Privacy Policy" />

        <UButton type="submit" block :loading="isLoading" label="Create account" />
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-muted">
          Already have an account?
          <NuxtLink to="/login" class="text-primary font-medium hover:underline">Sign in</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
```

### 24.7 Generated Forgot Password Page

```vue
<!--
  ──────────────────────────────────────────────────────────────
   Forgot Password Page — 2-Step OTP Flow
   Module:  auth
   Route:   /forgot-password
  ──────────────────────────────────────────────────────────────
   Step 1: Enter email → send OTP
   Step 2: Enter 6-digit OTP → navigate to /reset-password

   Generated by Vono CLI — https://vono.dev
  ──────────────────────────────────────────────────────────────
-->

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePage({ meta: { auth: false } })

const step = ref<'email' | 'otp'>('email')

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
})
type EmailSchema = z.output<typeof emailSchema>
const emailState = reactive<Partial<EmailSchema>>({ email: undefined })

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
})
type OtpSchema = z.output<typeof otpSchema>
const otpState = reactive<Partial<OtpSchema>>({ otp: undefined })

// ─── Resend countdown (5 minutes) ────────────────────────────
const countdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

function startCountdown() {
  countdown.value = 300
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    if (countdown.value > 0) countdown.value -= 1
    else if (countdownInterval) clearInterval(countdownInterval)
  }, 1000)
}

const countdownLabel = computed(() => {
  const mins = Math.floor(countdown.value / 60).toString().padStart(2, '0')
  const secs = (countdown.value % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
})

onUnmounted(() => { if (countdownInterval) clearInterval(countdownInterval) })

const toast = useToast()
const { forgotPassword } = useAuth()
const { fieldErrors, applyApiError, clearErrors } = useFormErrors<'email'>()

const isSendingOtp = ref(false)
const isVerifyingOtp = ref(false)

async function onSubmitEmail(event: FormSubmitEvent<EmailSchema>) {
  clearErrors()
  isSendingOtp.value = true
  try {
    await forgotPassword(event.data.email)
    toast.add({ title: 'OTP sent!', description: 'Check your inbox for the 6-digit code.', color: 'success' })
    step.value = 'otp'
    startCountdown()
  } catch (err: any) {
    if (!applyApiError(err)) {
      toast.add({ title: 'Failed to send OTP', description: err?.message || 'Could not send OTP.', color: 'error' })
    }
  } finally {
    isSendingOtp.value = false
  }
}

async function onSubmitOtp(event: FormSubmitEvent<OtpSchema>) {
  isVerifyingOtp.value = true
  await navigateTo(`/reset-password?email=${encodeURIComponent(emailState.email!)}&otp=${event.data.otp}`)
}

async function resendOtp() {
  if (!emailState.email) return
  isSendingOtp.value = true
  try {
    await forgotPassword(emailState.email)
    toast.add({ title: 'OTP resent!', description: 'New code sent to your inbox.', color: 'success' })
    startCountdown()
  } catch (err: any) {
    toast.add({ title: 'Resend failed', description: err?.message || 'Try again.', color: 'error' })
  } finally {
    isSendingOtp.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">{{ step === 'email' ? 'Forgot password?' : 'Enter OTP' }}</h1>
          <p class="text-sm text-muted mt-1">
            {{ step === 'email' ? "We'll send a 6-digit code to your email" : `Code sent to ${emailState.email}` }}
          </p>
        </div>
      </template>

      <!-- Step 1: Email -->
      <UForm v-if="step === 'email'" :schema="emailSchema" :state="emailState" @submit="onSubmitEmail" class="space-y-4">
        <UFormField label="Email" name="email" :error="fieldErrors.email">
          <UInput v-model="emailState.email" type="email" placeholder="you@example.com" icon="i-lucide-mail" />
        </UFormField>
        <UButton type="submit" block :loading="isSendingOtp" label="Send OTP" />
      </UForm>

      <!-- Step 2: OTP -->
      <UForm v-else :schema="otpSchema" :state="otpState" @submit="onSubmitOtp" class="space-y-4">
        <UFormField label="6-digit code" name="otp">
          <UInput v-model="otpState.otp" placeholder="000000" maxlength="6" class="text-center text-lg tracking-widest" />
        </UFormField>
        <UButton type="submit" block :loading="isVerifyingOtp" label="Verify & Continue" />
        <div class="text-center text-sm text-muted">
          <template v-if="countdown > 0">Resend in {{ countdownLabel }}</template>
          <UButton v-else variant="link" :loading="isSendingOtp" label="Resend OTP" @click="resendOtp" />
        </div>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-muted">
          <NuxtLink to="/login" class="text-primary hover:underline">Back to login</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
```

### 24.8 Generated Reset Password Page

```vue
<!--
  ──────────────────────────────────────────────────────────────
   Reset Password Page
   Module:  auth
   Route:   /reset-password?email=...&otp=...
  ──────────────────────────────────────────────────────────────
   Pre-fills email and OTP from query params (from forgot-password flow).
   User enters new password + confirmation → calls POST /api/v1/auth/reset-password.

   Generated by Vono CLI — https://vono.dev
  ──────────────────────────────────────────────────────────────
-->

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePage({ meta: { auth: false } })

const route = useRoute()
const toast = useToast()
const { resetPassword } = useAuth()

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: (route.query.email as string) || undefined,
  otp: (route.query.otp as string) || undefined,
  password: undefined,
  confirmPassword: undefined,
})

const showPassword = ref(false)
const isLoading = ref(false)
const { fieldErrors, applyApiError, clearErrors } = useFormErrors<'password' | 'confirmPassword'>()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  clearErrors()
  isLoading.value = true
  try {
    await resetPassword(event.data.email, event.data.otp, event.data.password)
    toast.add({ title: 'Password reset!', description: 'You can now sign in with your new password.', color: 'success' })
    await navigateTo('/login')
  } catch (err: any) {
    if (!applyApiError(err)) {
      toast.add({ title: 'Reset failed', description: err?.message || 'Could not reset password.', color: 'error' })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">Set new password</h1>
          <p class="text-sm text-muted mt-1">Choose a strong password for your account</p>
        </div>
      </template>

      <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" disabled icon="i-lucide-mail" />
        </UFormField>

        <UFormField label="OTP Code" name="otp">
          <UInput v-model="state.otp" disabled class="tracking-widest" />
        </UFormField>

        <UFormField label="New password" name="password" :error="fieldErrors.password">
          <UInput v-model="state.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••">
            <template #trailing>
              <UButton variant="ghost" size="xs" :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="showPassword = !showPassword" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Confirm password" name="confirmPassword" :error="fieldErrors.confirmPassword">
          <UInput v-model="state.confirmPassword" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" />
        </UFormField>

        <UButton type="submit" block :loading="isLoading" label="Reset password" />
      </UForm>
    </UCard>
  </div>
</template>
```

### 24.9 Generated `useAuth` Composable

> **Note:** This composable uses Vono's own `useCookie()`, `useState()`, `useVonoFetch()`, `navigateTo()`, and `useRuntimeConfig()` — NOT Nuxt equivalents. See [Section 28: Vono Composables](#28-vono-composables--client-runtime) for their API.

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  useAuth — JWT Authentication Composable
 *  Path:  src/modules/auth/composables/useAuth.ts
 * ──────────────────────────────────────────────────────────────
 *  Manages access/refresh tokens, user state, and auth API calls.
 *  Tokens are stored in cookies for SSR compatibility.
 *  Includes auto-refresh on 401 responses.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

export function useAuth() {
  const config = useRuntimeConfig?.() ?? { public: { apiBase: '/api/v1' } }
  const apiBase = config.public?.apiBase ?? '/api/v1'

  // ─── Reactive state ──────────────────────────────────────
  const user = useState<any | null>('auth-user', () => null)
  const authInitialized = useState<boolean>('auth-initialized', () => false)
  const accessToken = useCookie<string | null>('access_token', { maxAge: 60 * 60 * 24 * 7, path: '/' })
  const refreshToken = useCookie<string | null>('refresh_token', { maxAge: 60 * 60 * 24 * 30, path: '/' })
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)

  // ─── API fetch with auto-refresh ─────────────────────────
  async function fetchApi<T = any>(endpoint: string, options: any = {}): Promise<T> {
    const headers: Record<string, string> = { ...options.headers }
    if (accessToken.value) headers['Authorization'] = `Bearer ${accessToken.value}`

    try {
      return await $fetch<T>(`${apiBase}${endpoint}`, { ...options, headers })
    } catch (err: any) {
      if (err.response?.status === 401 && refreshToken.value && endpoint !== '/auth/refresh') {
        try {
          const res = await $fetch<any>(`${apiBase}/auth/refresh`, {
            method: 'POST',
            body: { refreshToken: refreshToken.value },
          })
          if (res.success && res.data) {
            accessToken.value = res.data.accessToken
            refreshToken.value = res.data.refreshToken
            headers['Authorization'] = `Bearer ${accessToken.value}`
            return await $fetch<T>(`${apiBase}${endpoint}`, { ...options, headers })
          }
        } catch {
          user.value = null
          accessToken.value = null
          refreshToken.value = null
          await navigateTo('/login')
        }
      }
      throw err
    }
  }

  // ─── Auth actions ─────────────────────────────────────────
  async function login(email: string, password: string) {
    const data = await fetchApi('/auth/login', { method: 'POST', body: { email, password } })
    if (data.success && data.data) {
      accessToken.value = data.data.accessToken
      refreshToken.value = data.data.refreshToken
      user.value = data.data.account
    }
    return data
  }

  async function register(email: string, password: string, name: string) {
    const data = await fetchApi('/auth/register', {
      method: 'POST',
      body: { name, email, password, confirmPassword: password },
    })
    if (data.success && data.data) {
      accessToken.value = data.data.accessToken
      refreshToken.value = data.data.refreshToken
      user.value = data.data.account
    }
    return data
  }

  async function forgotPassword(email: string) {
    return fetchApi('/auth/forgot-password', { method: 'POST', body: { email } })
  }

  async function resetPassword(email: string, otp: string, password: string) {
    return fetchApi('/auth/reset-password', {
      method: 'POST',
      body: { email, otp, password, confirmPassword: password },
    })
  }

  async function logout() {
    try { await fetchApi('/auth/logout', { method: 'POST' }) } catch {}
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    await navigateTo('/login')
  }

  async function initAuth() {
    if (authInitialized.value) return
    try {
      if (accessToken.value) {
        const data = await fetchApi('/auth/me')
        if (data.success) user.value = data.data
      }
    } catch { /* token invalid — stay logged out */ }
    authInitialized.value = true
  }

  // ─── OAuth (generated only if selected) ───────────────────
  function loginWithGoogle() {
    window.location.href = `${apiBase}/auth/google`
  }

  function loginWithGithub() {
    window.location.href = `${apiBase}/auth/github`
  }

  return {
    user, isAuthenticated, authInitialized,
    fetchApi, login, register, forgotPassword, resetPassword, logout, initAuth,
    loginWithGoogle, loginWithGithub,
  }
}
```

### 24.10 Generated `useFormErrors` Composable

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  useFormErrors — Field-Level Error Extraction
 *  Path:  src/modules/auth/composables/useFormErrors.ts
 * ──────────────────────────────────────────────────────────────
 *  Extracts per-field errors from 422 API responses and maps them
 *  to Nuxt UI's UFormField :error prop for inline display.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

export function useFormErrors<T extends string>() {
  const fieldErrors = reactive<Record<T, string | undefined>>({} as any)

  function applyApiError(err: any): boolean {
    const errors = err?.response?._data?.errors || err?.data?.errors
    if (!errors || typeof errors !== 'object') return false

    clearErrors()
    for (const [key, msg] of Object.entries(errors)) {
      (fieldErrors as any)[key] = Array.isArray(msg) ? msg[0] : msg
    }
    return true
  }

  function clearErrors() {
    for (const key of Object.keys(fieldErrors)) {
      (fieldErrors as any)[key] = undefined
    }
  }

  return { fieldErrors, applyApiError, clearErrors }
}
```

### 24.11 Generated Auth Middleware (Client-Side Route Guard)

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Auth Route Guard — Global Client-Side Middleware
 *  Path:  src/shared/middleware/auth.guard.ts
 * ──────────────────────────────────────────────────────────────
 *  Protects dashboard routes from unauthenticated users.
 *  Redirects authenticated users away from login/register pages.
 *  Waits for initAuth() to complete before making redirect decisions.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

// Registered as a global before-each guard in router.ts
export function authGuard(to: any, from: any) {
  const { isAuthenticated, authInitialized } = useAuth()

  // Pages that don't require auth
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password']
  const isPublic = publicRoutes.includes(to.path)

  // Pages that should redirect away if already logged in
  const authOnlyRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthOnly = authOnlyRoutes.includes(to.path)

  if (!isAuthenticated.value && !isPublic) {
    return `/login?redirect=${encodeURIComponent(to.fullPath)}`
  }

  if (isAuthenticated.value && isAuthOnly) {
    return '/dashboard'
  }
}
```

### 24.12 Generated Dashboard Pages

```vue
<!--
  ──────────────────────────────────────────────────────────────
   Dashboard Home
   Route:  /dashboard  (file-based: dashboard/index.page.vue)
  ──────────────────────────────────────────────────────────────
   Overview page shown after login. Displays welcome message
   and quick-start cards. Customize to fit your app.

   Generated by Vono CLI — https://vono.dev
  ──────────────────────────────────────────────────────────────
-->

<script setup lang="ts">
definePage({ meta: { layout: 'dashboard' } })

const { user } = useAuth()
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Welcome back, {{ user?.name ?? 'there' }}!</h1>
      <p class="text-muted mt-1">Here's what's happening with your account.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard>
        <template #header><span class="font-medium">Quick Start</span></template>
        <p class="text-sm text-muted">Start building your app by creating modules.</p>
        <template #footer>
          <UButton label="Create Module" variant="soft" size="sm" />
        </template>
      </UCard>

      <UCard>
        <template #header><span class="font-medium">Profile</span></template>
        <p class="text-sm text-muted">Update your profile and security settings.</p>
        <template #footer>
          <UButton to="/dashboard/profile" label="Edit Profile" variant="soft" size="sm" />
        </template>
      </UCard>

      <UCard>
        <template #header><span class="font-medium">Docs</span></template>
        <p class="text-sm text-muted">Read the documentation to learn more.</p>
        <template #footer>
          <UButton label="View Docs" variant="soft" size="sm" />
        </template>
      </UCard>
    </div>
  </div>
</template>
```

```vue
<!--
  ──────────────────────────────────────────────────────────────
   Profile & Security Page
   Route:  /dashboard/profile
  ──────────────────────────────────────────────────────────────
   Edit name, change password, view sessions.

   Generated by Vono CLI — https://vono.dev
  ──────────────────────────────────────────────────────────────
-->

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePage({ meta: { layout: 'dashboard' } })

const toast = useToast()
const { user, fetchApi } = useAuth()

// ─── Profile form ──────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})
type ProfileSchema = z.output<typeof profileSchema>
const profileState = reactive<Partial<ProfileSchema>>({ name: user.value?.name })
const isUpdatingProfile = ref(false)

async function updateProfile(event: FormSubmitEvent<ProfileSchema>) {
  isUpdatingProfile.value = true
  try {
    const data = await fetchApi('/auth/me', { method: 'PATCH', body: event.data })
    if (data.success) {
      user.value = { ...user.value, ...event.data }
      toast.add({ title: 'Profile updated', color: 'success' })
    }
  } catch (err: any) {
    toast.add({ title: 'Update failed', description: err?.message, color: 'error' })
  } finally {
    isUpdatingProfile.value = false
  }
}

// ─── Password form ─────────────────────────────────────────
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type PasswordSchema = z.output<typeof passwordSchema>
const passwordState = reactive<Partial<PasswordSchema>>({})
const isUpdatingPassword = ref(false)

async function updatePassword(event: FormSubmitEvent<PasswordSchema>) {
  isUpdatingPassword.value = true
  try {
    await fetchApi('/auth/me/password', { method: 'PATCH', body: event.data })
    toast.add({ title: 'Password changed', color: 'success' })
    Object.assign(passwordState, { currentPassword: '', newPassword: '', confirmPassword: '' })
  } catch (err: any) {
    toast.add({ title: 'Failed', description: err?.message, color: 'error' })
  } finally {
    isUpdatingPassword.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-2xl space-y-8">
    <h1 class="text-2xl font-bold">Profile & Security</h1>

    <!-- Profile -->
    <UCard>
      <template #header><span class="font-medium">Profile</span></template>
      <UForm :schema="profileSchema" :state="profileState" @submit="updateProfile" class="space-y-4">
        <UFormField label="Name" name="name">
          <UInput v-model="profileState.name" icon="i-lucide-user" />
        </UFormField>
        <UFormField label="Email">
          <UInput :model-value="user?.email" disabled icon="i-lucide-mail" />
        </UFormField>
        <UButton type="submit" :loading="isUpdatingProfile" label="Save changes" />
      </UForm>
    </UCard>

    <!-- Change Password -->
    <UCard>
      <template #header><span class="font-medium">Change Password</span></template>
      <UForm :schema="passwordSchema" :state="passwordState" @submit="updatePassword" class="space-y-4">
        <UFormField label="Current password" name="currentPassword">
          <UInput v-model="passwordState.currentPassword" type="password" />
        </UFormField>
        <UFormField label="New password" name="newPassword">
          <UInput v-model="passwordState.newPassword" type="password" />
        </UFormField>
        <UFormField label="Confirm new password" name="confirmPassword">
          <UInput v-model="passwordState.confirmPassword" type="password" />
        </UFormField>
        <UButton type="submit" :loading="isUpdatingPassword" label="Update password" />
      </UForm>
    </UCard>
  </div>
</template>
```

### 24.13 Generated Dashboard Layout

```vue
<!--
  ──────────────────────────────────────────────────────────────
   Dashboard Layout — Sidebar + Topbar
  ──────────────────────────────────────────────────────────────
   Used by all /dashboard/* pages via definePage({ meta: { layout: 'dashboard' } }).
   Includes collapsible sidebar, user dropdown, and dark mode toggle.

   Generated by Vono CLI — https://vono.dev
  ──────────────────────────────────────────────────────────────
-->

<script setup lang="ts">
const { user, logout } = useAuth()
const isSidebarOpen = ref(true)

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
  { label: 'Profile', to: '/dashboard/profile', icon: 'i-lucide-user' },
]

const userMenuItems = [
  [
    { label: 'Profile', icon: 'i-lucide-user', to: '/dashboard/profile' },
  ],
  [
    { label: 'Sign out', icon: 'i-lucide-log-out', click: () => logout() },
  ],
]
</script>

<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Sidebar -->
    <aside
      :class="isSidebarOpen ? 'w-64' : 'w-16'"
      class="bg-white dark:bg-gray-900 border-r transition-all duration-200 flex flex-col"
    >
      <div class="p-4 flex items-center justify-between border-b">
        <span v-if="isSidebarOpen" class="font-bold text-lg">My App</span>
        <UButton
          variant="ghost"
          :icon="isSidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'"
          @click="isSidebarOpen = !isSidebarOpen"
        />
      </div>

      <nav class="flex-1 p-2 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
          active-class="bg-primary-50 dark:bg-primary-950 text-primary"
        >
          <UIcon :name="item.icon" class="size-5 shrink-0" />
          <span v-if="isSidebarOpen">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="bg-white dark:bg-gray-900 border-b px-6 py-3 flex items-center justify-end gap-4">
        <UDropdownMenu :items="userMenuItems">
          <UButton variant="ghost" class="gap-2">
            <UAvatar :text="user?.name?.charAt(0)" size="xs" />
            <span class="text-sm">{{ user?.name }}</span>
          </UButton>
        </UDropdownMenu>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
```

### 24.14 Auth Scaffolding Summary

| Generated artifact | Path | Purpose |
|---|---|---|
| **Auth routes** | `src/modules/auth/auth.routes.ts` | Login, register, logout, refresh, forgot/reset password, profile |
| **Auth controller** | `src/modules/auth/auth.controller.ts` | Request handling — delegates to service |
| **Auth service** | `src/modules/auth/auth.service.ts` | JWT generation, password hashing, OTP via cache |
| **Auth DTOs** | `src/modules/auth/auth.dto.ts` | Zod validation schemas |
| **Auth schema** | `src/modules/auth/auth.schema.ts` | Drizzle users table + sessions |
| **Login page** | `src/modules/auth/login.page.vue` | Email/password + OAuth buttons |
| **Register page** | `src/modules/auth/register.page.vue` | Name, email, password, terms |
| **Forgot password** | `src/modules/auth/forgot-password.page.vue` | 2-step OTP flow |
| **Reset password** | `src/modules/auth/reset-password.page.vue` | Pre-filled from query params |
| **OAuth callback** | `src/modules/auth/auth/callback.page.vue` | Token extraction + redirect |
| **Dashboard home** | `src/modules/dashboard/index.page.vue` | Welcome + quick-start cards |
| **Profile page** | `src/modules/dashboard/profile.page.vue` | Edit name, change password |
| **Dashboard layout** | `src/shared/layouts/dashboard.vue` | Sidebar + topbar + user menu |
| **`useAuth`** | `src/modules/auth/composables/useAuth.ts` | JWT tokens, login/register/logout, auto-refresh |
| **`useFormErrors`** | `src/modules/auth/composables/useFormErrors.ts` | 422 error → field-level display |
| **Auth guard** | `src/shared/middleware/auth.guard.ts` | Route protection (client-side) |
| **Auth middleware** | `src/shared/middleware/auth.middleware.ts` | JWT verification (server-side) |

---

## 25. Notifications — In-App Alerts & Preferences

When **notifications** is selected in the wizard (or added later via `bun vono add notifications`), Vono generates a complete notification system: Drizzle tables, API routes, services, and (in fullstack mode) a notifications page with preferences.

### 25.1 What Gets Generated

```
src/
  modules/
    notifications/
      notifications.routes.ts         # API endpoints
      notifications.controller.ts     # Request handling
      notifications.service.ts        # CRUD, mark-read, preferences
      notifications.dto.ts            # Zod validation schemas
      notifications.schema.ts         # Drizzle tables
      notifications.page.vue          # Notifications page (fullstack only)
      composables/
        useNotifications.ts           # Frontend composable (fullstack only)
```

### 25.2 Generated Notification Schema

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Notification Schema — Drizzle Tables
 *  Module:  notifications
 * ──────────────────────────────────────────────────────────────
 *  Generates `notifications` and `notification_preferences` tables.
 *  Auto-registered into the global schema by Vono CLI.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { pgTable, serial, varchar, text, boolean, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from '../auth/auth.schema'

// ─── Notifications table ─────────────────────────────────────
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Classification
  type: varchar('type', { length: 50 }).notNull().default('info'),
  //  'info' | 'warning' | 'success' | 'error'
  category: varchar('category', { length: 50 }).notNull().default('system_updates'),
  //  'account_billing' | 'security' | 'system_updates' (configurable in vono.config.ts)

  // Content
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),

  // State
  actionNeeded: boolean('action_needed').default(false),
  actionUrl: varchar('action_url', { length: 1000 }),
  readAt: timestamp('read_at', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),  // Soft delete
}, (table) => [
  index('idx_notifications_user_id').on(table.userId),
  index('idx_notifications_category').on(table.category),
  index('idx_notifications_read_at').on(table.readAt),
  index('idx_notifications_created_at').on(table.createdAt),
  index('idx_notifications_deleted_at').on(table.deletedAt),
])

// ─── Notification Preferences table ──────────────────────────
export const notificationPreferences = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  billingNotifications: boolean('billing_notifications').default(true),
  securityNotifications: boolean('security_notifications').default(true),
  systemNotifications: boolean('system_notifications').default(true),

  frequency: varchar('frequency', { length: 20 }).default('realtime'),
  //  'realtime' | 'daily' | 'weekly'

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_notification_prefs_user_id').on(table.userId),
])
```

### 25.3 Generated Notification API Routes

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Notification Routes
 *  Module:  notifications
 *  Path:    /api/v1/notifications
 * ──────────────────────────────────────────────────────────────
 *  CRUD for in-app notifications + user preferences.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { Hono } from 'hono'
import type { AppVariables } from '../../types'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { zValidator } from '../../shared/validators/validator-wrapper'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { UpdatePreferencesDto } from './notifications.dto'

const notificationsRoutes = new Hono<{ Variables: AppVariables }>()

// All routes require auth
notificationsRoutes.use('*', authMiddleware)

notificationsRoutes.use('*', async (c, next) => {
  const service = new NotificationsService(c.get('db'))
  c.set('notificationsController', new NotificationsController(service))
  await next()
})

// ─── List & count ───────────────────────────────────────────
notificationsRoutes.get('/',             (c) => c.get('notificationsController').list(c))
notificationsRoutes.get('/unread-count', (c) => c.get('notificationsController').unreadCount(c))

// ─── Mark as read ───────────────────────────────────────────
notificationsRoutes.put('/read-all',     (c) => c.get('notificationsController').markAllAsRead(c))
notificationsRoutes.put('/:id/read',     (c) => c.get('notificationsController').markAsRead(c))

// ─── Delete ─────────────────────────────────────────────────
notificationsRoutes.delete('/:id',       (c) => c.get('notificationsController').remove(c))

// ─── Preferences ────────────────────────────────────────────
notificationsRoutes.get('/preferences',  (c) => c.get('notificationsController').getPreferences(c))
notificationsRoutes.put('/preferences',  zValidator('json', UpdatePreferencesDto), (c) => c.get('notificationsController').updatePreferences(c))

export { notificationsRoutes }
```

### 25.4 Generated Notification Service

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Notification Service
 *  Module:  notifications
 * ──────────────────────────────────────────────────────────────
 *  Business logic for notifications CRUD and preferences.
 *  Used by controllers and also internally by other services
 *  to create notifications (e.g. auth, billing, system events).
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { eq, and, isNull, desc, count as drizzleCount } from 'drizzle-orm'
import { notifications, notificationPreferences } from './notifications.schema'

export class NotificationsService {
  constructor(private db: any) {}

  // ─── Public API (used by other modules to create notifications) ─
  async notify(userId: number, data: {
    type?: 'info' | 'warning' | 'success' | 'error'
    category?: string
    title: string
    description?: string
    actionNeeded?: boolean
    actionUrl?: string
  }) {
    return this.db.insert(notifications).values({
      userId,
      type: data.type ?? 'info',
      category: data.category ?? 'system_updates',
      title: data.title,
      description: data.description,
      actionNeeded: data.actionNeeded ?? false,
      actionUrl: data.actionUrl,
    }).returning()
  }

  // ─── List (paginated, filterable) ──────────────────────────
  async list(userId: number, opts?: { category?: string; page?: number; perPage?: number }) {
    const page = opts?.page ?? 1
    const perPage = opts?.perPage ?? 20
    const conditions = [eq(notifications.userId, userId), isNull(notifications.deletedAt)]
    if (opts?.category) conditions.push(eq(notifications.category, opts.category))

    const [items, [{ total }]] = await Promise.all([
      this.db.select().from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(perPage).offset((page - 1) * perPage),
      this.db.select({ total: drizzleCount() }).from(notifications)
        .where(and(...conditions)),
    ])

    return { items, total, page, pages: Math.ceil(total / perPage) }
  }

  // ─── Unread count ──────────────────────────────────────────
  async unreadCount(userId: number) {
    const [{ total }] = await this.db.select({ total: drizzleCount() }).from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt), isNull(notifications.deletedAt)))
    return total
  }

  // ─── Mark as read ──────────────────────────────────────────
  async markAsRead(userId: number, id: number) {
    return this.db.update(notifications).set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
  }

  async markAllAsRead(userId: number) {
    return this.db.update(notifications).set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt), isNull(notifications.deletedAt)))
  }

  // ─── Soft delete ───────────────────────────────────────────
  async remove(userId: number, id: number) {
    return this.db.update(notifications).set({ deletedAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
  }

  // ─── Preferences ──────────────────────────────────────────
  async getPreferences(userId: number) {
    const [prefs] = await this.db.select().from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
    if (prefs) return prefs

    // Create defaults if none exist
    const [created] = await this.db.insert(notificationPreferences)
      .values({ userId }).returning()
    return created
  }

  async updatePreferences(userId: number, data: Partial<{
    billingNotifications: boolean
    securityNotifications: boolean
    systemNotifications: boolean
    frequency: string
  }>) {
    return this.db.update(notificationPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId))
  }
}
```

### 25.5 Generated Notification DTOs

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Notification DTOs — Zod Validation Schemas
 *  Module:  notifications
 * ──────────────────────────────────────────────────────────────
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { z } from 'zod'

export const UpdatePreferencesDto = z.object({
  billingNotifications: z.boolean().optional(),
  securityNotifications: z.boolean().optional(),
  systemNotifications: z.boolean().optional(),
  frequency: z.enum(['realtime', 'daily', 'weekly']).optional(),
})

export const CreateNotificationDto = z.object({
  type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
  category: z.enum(['account_billing', 'security', 'system_updates']).default('system_updates'),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  actionNeeded: z.boolean().default(false),
  actionUrl: z.string().url().max(1000).optional(),
})
```

### 25.6 Generated `useNotifications` Composable (Fullstack)

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  useNotifications — Notification State & Actions
 *  Path:  src/modules/notifications/composables/useNotifications.ts
 * ──────────────────────────────────────────────────────────────
 *  Manages fetching, reading, and deleting notifications.
 *  Also handles notification preferences (toggles, frequency).
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

export function useNotifications() {
  const { fetchApi } = useAuth()

  const notifications = ref<any[]>([])
  const unreadCount = ref(0)
  const total = ref(0)
  const page = ref(1)
  const pages = ref(1)
  const isLoading = ref(false)

  const preferences = ref({
    billingNotifications: true,
    securityNotifications: true,
    systemNotifications: true,
    frequency: 'realtime',
  })
  const isSavingPrefs = ref(false)

  async function fetchNotifications(opts?: { category?: string; page?: number }) {
    isLoading.value = true
    try {
      const params = new URLSearchParams()
      if (opts?.category) params.set('category', opts.category)
      if (opts?.page) params.set('page', String(opts.page))

      const data = await fetchApi(`/notifications?${params.toString()}`)
      if (data.success) {
        notifications.value = opts?.page && opts.page > 1
          ? [...notifications.value, ...data.data.items]
          : data.data.items
        total.value = data.data.total
        page.value = data.data.page
        pages.value = data.data.pages
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUnreadCount() {
    const data = await fetchApi('/notifications/unread-count')
    if (data.success) unreadCount.value = data.data
  }

  async function markAsRead(id: number) {
    await fetchApi(`/notifications/${id}/read`, { method: 'PUT' })
    const n = notifications.value.find((n) => n.id === id)
    if (n) { n.readAt = new Date().toISOString(); unreadCount.value = Math.max(0, unreadCount.value - 1) }
  }

  async function markAllAsRead() {
    await fetchApi('/notifications/read-all', { method: 'PUT' })
    notifications.value.forEach((n) => { if (!n.readAt) n.readAt = new Date().toISOString() })
    unreadCount.value = 0
  }

  async function deleteNotification(id: number) {
    await fetchApi(`/notifications/${id}`, { method: 'DELETE' })
    notifications.value = notifications.value.filter((n) => n.id !== id)
    total.value -= 1
  }

  async function fetchPreferences() {
    const data = await fetchApi('/notifications/preferences')
    if (data.success) preferences.value = data.data
  }

  async function updatePreferences(update: Partial<typeof preferences.value>) {
    isSavingPrefs.value = true
    try {
      await fetchApi('/notifications/preferences', { method: 'PUT', body: update })
    } finally {
      isSavingPrefs.value = false
    }
  }

  return {
    notifications, unreadCount, total, page, pages, isLoading,
    preferences, isSavingPrefs,
    fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead,
    deleteNotification, fetchPreferences, updatePreferences,
  }
}
```

### 25.7 Generated Notifications Page (Fullstack)

```vue
<!--
  ──────────────────────────────────────────────────────────────
   Notifications Page
   Module:  notifications
   Route:   /dashboard/notifications
  ──────────────────────────────────────────────────────────────
   In-app notification inbox with category filters, mark-as-read,
   and notification preferences panel.

   Generated by Vono CLI — https://vono.dev
  ──────────────────────────────────────────────────────────────
-->

<script setup lang="ts">
definePage({ meta: { layout: 'dashboard' } })

const {
  notifications, unreadCount, total, page, pages, isLoading,
  preferences, isSavingPrefs,
  fetchNotifications, fetchUnreadCount,
  markAsRead, markAllAsRead, deleteNotification,
  fetchPreferences, updatePreferences,
} = useNotifications()

const activeFilter = ref('All')
const filterMap: Record<string, string | undefined> = {
  'All': undefined,
  'Account & Billing': 'account_billing',
  'Security': 'security',
  'System Updates': 'system_updates',
}
const filters = Object.keys(filterMap)

const pageLoading = ref(true)

onMounted(async () => {
  await Promise.all([fetchNotifications(), fetchUnreadCount(), fetchPreferences()])
  pageLoading.value = false
})

watch(activeFilter, () => {
  page.value = 1
  fetchNotifications({ category: filterMap[activeFilter.value] })
})

function handleClick(notification: any) {
  if (!notification.readAt) markAsRead(notification.id)
}

function getIcon(type: string) {
  switch (type) {
    case 'warning': return 'i-lucide-alert-triangle'
    case 'success': return 'i-lucide-check-circle-2'
    case 'error':   return 'i-lucide-x-circle'
    default:        return 'i-lucide-bell'
  }
}

function getColor(type: string) {
  switch (type) {
    case 'warning': return 'text-orange-500'
    case 'success': return 'text-green-500'
    case 'error':   return 'text-red-500'
    default:        return 'text-gray-500'
  }
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMs / 3600000)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffMs / 86400000)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="p-6 max-w-4xl space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Notifications</h1>
        <p class="text-sm text-muted mt-1">Stay informed about your account and security.</p>
      </div>
      <UButton variant="outline" icon="i-lucide-check-check" label="Mark all read"
        :disabled="unreadCount === 0" @click="markAllAsRead" />
    </div>

    <!-- Filter chips -->
    <div class="flex gap-2 flex-wrap">
      <UButton v-for="f in filters" :key="f" size="sm"
        :variant="activeFilter === f ? 'solid' : 'outline'"
        :color="activeFilter === f ? 'primary' : 'neutral'"
        :label="f" @click="activeFilter = f" />
    </div>

    <!-- Empty state -->
    <div v-if="!isLoading && notifications.length === 0"
      class="flex flex-col items-center justify-center py-20 gap-3 text-muted">
      <UIcon name="i-lucide-bell-off" class="size-10" />
      <p class="font-medium">No notifications yet</p>
    </div>

    <!-- Notification list -->
    <div class="space-y-2">
      <div v-for="n in notifications" :key="n.id"
        :class="[!n.readAt ? 'bg-primary-50/50 dark:bg-primary-950/10' : '']"
        class="flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
        @click="handleClick(n)">
        <UIcon :name="getIcon(n.type)" :class="getColor(n.type)" class="size-5 mt-0.5 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium truncate">{{ n.title }}</p>
            <div v-if="!n.readAt" class="size-2 rounded-full bg-primary shrink-0" />
          </div>
          <p v-if="n.description" class="text-xs text-muted mt-0.5 line-clamp-2">{{ n.description }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs text-muted">{{ formatTime(n.createdAt) }}</span>
          <UButton variant="ghost" size="xs" icon="i-lucide-trash-2" color="error"
            @click.stop="deleteNotification(n.id)" />
        </div>
      </div>
    </div>

    <!-- Load more -->
    <div v-if="page < pages" class="flex justify-center">
      <UButton variant="outline" label="Load more" :loading="isLoading"
        @click="fetchNotifications({ page: page + 1, category: filterMap[activeFilter] })" />
    </div>

    <!-- Preferences panel -->
    <UCard class="mt-8">
      <template #header><span class="font-medium">Notification Preferences</span></template>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Billing notifications</p>
            <p class="text-xs text-muted">Payment reminders, invoice updates</p>
          </div>
          <USwitch :model-value="preferences.billingNotifications"
            @update:model-value="(v: boolean) => { preferences.billingNotifications = v; updatePreferences({ billingNotifications: v }) }" />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Security alerts</p>
            <p class="text-xs text-muted">Login from new device, password changes</p>
          </div>
          <USwitch :model-value="preferences.securityNotifications"
            @update:model-value="(v: boolean) => { preferences.securityNotifications = v; updatePreferences({ securityNotifications: v }) }" />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">System updates</p>
            <p class="text-xs text-muted">Feature launches, maintenance windows</p>
          </div>
          <USwitch :model-value="preferences.systemNotifications"
            @update:model-value="(v: boolean) => { preferences.systemNotifications = v; updatePreferences({ systemNotifications: v }) }" />
        </div>
        <UDivider />
        <div>
          <p class="text-sm font-medium mb-2">Delivery frequency</p>
          <div class="flex gap-2">
            <UButton v-for="freq in ['realtime', 'daily', 'weekly']" :key="freq" size="sm"
              :variant="preferences.frequency === freq ? 'solid' : 'outline'"
              :label="freq.charAt(0).toUpperCase() + freq.slice(1)"
              @click="preferences.frequency = freq; updatePreferences({ frequency: freq })" />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
```

### 25.8 Creating Notifications from Other Modules

The `NotificationsService.notify()` method is the public API for creating notifications from anywhere:

```ts
// In any other service (e.g., billing.service.ts):
import { NotificationsService } from '../notifications/notifications.service'

export class BillingService {
  private notifications: NotificationsService

  constructor(private db: any) {
    this.notifications = new NotificationsService(db)
  }

  async processPayment(userId: number, amount: number) {
    // ... process payment ...

    // Notify the user
    await this.notifications.notify(userId, {
      type: 'success',
      category: 'account_billing',
      title: `Payment of $${amount} received`,
      description: 'Your subscription has been renewed.',
      actionUrl: '/dashboard/billing',
    })
  }

  async paymentFailed(userId: number) {
    await this.notifications.notify(userId, {
      type: 'error',
      category: 'account_billing',
      title: 'Payment failed',
      description: 'Please update your payment method to continue your subscription.',
      actionNeeded: true,
      actionUrl: '/dashboard/billing/payment-methods',
    })
  }
}
```

### 25.9 `make:notification` Generator

```bash
$ bun vono make:notification payment_received

  ✔ Created src/modules/notifications/templates/payment-received.ts

# Generated file:
```

```ts
// src/modules/notifications/templates/payment-received.ts
import type { NotificationsService } from '../notifications.service'

export async function sendPaymentReceivedNotification(
  notificationService: NotificationsService,
  userId: number,
  data: { amount: number; currency: string },
) {
  return notificationService.notify(userId, {
    type: 'success',
    category: 'account_billing',
    title: `Payment of ${data.currency}${data.amount} received`,
    description: 'Thank you! Your payment has been processed successfully.',
    actionUrl: '/dashboard/billing',
  })
}
```

### 25.10 Notification Summary

| Generated artifact | Path | Purpose |
|---|---|---|
| **Schema** | `notifications.schema.ts` | `notifications` + `notification_preferences` tables |
| **Routes** | `notifications.routes.ts` | List, unread count, mark-read, delete, preferences |
| **Controller** | `notifications.controller.ts` | Request handling |
| **Service** | `notifications.service.ts` | CRUD + `notify()` public API for other modules |
| **DTOs** | `notifications.dto.ts` | Zod validation |
| **Page** | `notifications.page.vue` | Inbox UI with filters + preferences (fullstack) |
| **Composable** | `useNotifications.ts` | Reactive notification state (fullstack) |
| **Template** | `make:notification` generates | Reusable notification templates per event |

---

## 26. Logging — Activity & Audit Trail

When **logging** is selected in the wizard (or added later via `bun vono add logging`), Vono generates an activity logging system that **automatically uses the queue when available** for async persistence, falling back to synchronous DB writes when no queue is configured.

### 26.1 Queue-Aware Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────────┐
│  Any Service     │     │  LoggingService.log(event)               │
│  (auth, billing) │────▶│                                          │
│                  │     │  if (queue available) {                  │
└─────────────────┘     │    dispatch(LogActivityJob, event)  ──▶ Queue ──▶ Worker ──▶ DB │
                        │  } else {                                │
                        │    await db.insert(activityLogs, event)  │ ◀── synchronous     │
                        │  }                                       │
                        └──────────────────────────────────────────┘
```

> **Logging should always be async when possible.** Writing directly to the DB during a request adds latency. When a queue driver is available (BullMQ, CF Queues, SQS, Upstash), logs are dispatched as jobs and persisted by a background worker. This keeps API response times fast.

### 26.2 What Gets Generated

```
src/
  modules/
    logging/
      logging.schema.ts           # Drizzle activity_logs table
      logging.service.ts          # Log dispatcher (queue or sync)
      logging.routes.ts           # Admin API for viewing logs
      logging.controller.ts       # Request handling
      logging.dto.ts              # Zod validation
      jobs/
        log-activity.job.ts       # Queue job (generated if queue available)
```

### 26.3 Generated Activity Logs Schema

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Activity Logs Schema — Drizzle Table
 *  Module:  logging
 * ──────────────────────────────────────────────────────────────
 *  Stores all application activity for audit trail purposes.
 *  Queried by admins via /api/v1/logs.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { pgTable, serial, integer, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from '../auth/auth.schema'

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),

  // Who
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  userEmail: varchar('user_email', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),       // IPv4 or IPv6

  // What
  action: varchar('action', { length: 100 }).notNull(),
  //  e.g. 'user.login', 'user.register', 'post.created', 'payment.processed'
  resource: varchar('resource', { length: 100 }),
  //  e.g. 'users', 'posts', 'invoices'
  resourceId: varchar('resource_id', { length: 100 }),
  //  e.g. '42', 'abc-123'

  // Details
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  //  Arbitrary context: { old: {...}, new: {...} }, { planId: 3 }, etc.

  // When
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_activity_logs_user_id').on(table.userId),
  index('idx_activity_logs_action').on(table.action),
  index('idx_activity_logs_resource').on(table.resource),
  index('idx_activity_logs_created_at').on(table.createdAt),
])
```

### 26.4 Generated Logging Service (Queue-Aware)

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Logging Service — Queue-Aware Activity Logger
 *  Module:  logging
 * ──────────────────────────────────────────────────────────────
 *  Dispatches log events via the queue driver when available.
 *  Falls back to synchronous DB inserts when no queue is configured.
 *
 *  The `log()` method is designed to never throw — logging failures
 *  should not break application flows.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { activityLogs } from './logging.schema'

export interface LogEvent {
  userId?: number
  userEmail?: string
  ipAddress?: string
  action: string
  resource?: string
  resourceId?: string
  description?: string
  metadata?: Record<string, any>
}

export class LoggingService {
  constructor(
    private db: any,
    private queue: any | null = null,  // Queue dispatcher (null = sync mode)
  ) {}

  /**
   * Log an activity event.
   * - If queue is available → dispatches async job (non-blocking)
   * - If no queue → writes directly to DB (sync)
   * - Never throws — catches errors internally
   */
  async log(event: LogEvent): Promise<void> {
    try {
      if (this.queue) {
        // ─── Async: dispatch to queue ─────────────────────
        await this.queue.dispatch('log-activity', event)
      } else {
        // ─── Sync: write directly to DB ───────────────────
        await this.persist(event)
      }
    } catch (err) {
      // Logging should never break the main flow
      console.error('[LoggingService] Failed to log activity:', err)
    }
  }

  /**
   * Persist a log event to the database.
   * Called directly in sync mode, or by the queue worker in async mode.
   */
  async persist(event: LogEvent): Promise<void> {
    await this.db.insert(activityLogs).values({
      userId: event.userId,
      userEmail: event.userEmail,
      ipAddress: event.ipAddress,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      description: event.description,
      metadata: event.metadata,
    })
  }

  /**
   * Query activity logs (admin API).
   */
  async list(opts?: {
    userId?: number
    action?: string
    resource?: string
    page?: number
    perPage?: number
  }) {
    const page = opts?.page ?? 1
    const perPage = opts?.perPage ?? 50
    const conditions: any[] = []

    if (opts?.userId) conditions.push(eq(activityLogs.userId, opts.userId))
    if (opts?.action) conditions.push(eq(activityLogs.action, opts.action))
    if (opts?.resource) conditions.push(eq(activityLogs.resource, opts.resource))

    const items = await this.db.select().from(activityLogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(activityLogs.createdAt))
      .limit(perPage).offset((page - 1) * perPage)

    return { items, page }
  }

  /**
   * Cleanup old logs based on retention policy.
   * Run via cron job: `bun vono cron:cleanup-logs`
   */
  async cleanup(retentionDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const result = await this.db.delete(activityLogs)
      .where(lt(activityLogs.createdAt, cutoff))
    return result.rowCount ?? 0
  }
}
```

### 26.5 Generated Queue Job (When Queue Available)

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Log Activity Job — Queue Worker
 *  Path:  src/modules/logging/jobs/log-activity.job.ts
 * ──────────────────────────────────────────────────────────────
 *  Processes log events dispatched by LoggingService.log().
 *  Runs in background via the configured queue driver.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import type { LogEvent } from '../logging.service'
import { LoggingService } from '../logging.service'

export const logActivityJob = {
  name: 'log-activity',

  async handle(event: LogEvent, { db }: { db: any }) {
    const loggingService = new LoggingService(db)
    await loggingService.persist(event)
  },

  // Retry policy
  retries: 3,
  backoff: { type: 'exponential', delay: 1000 },
}
```

### 26.6 Generated Logging API Routes (Admin)

```ts
/**
 * ──────────────────────────────────────────────────────────────
 *  Logging Routes — Admin API
 *  Module:  logging
 *  Path:    /api/v1/logs
 * ──────────────────────────────────────────────────────────────
 *  View activity logs. Admin-only access.
 *
 *  Generated by Vono CLI — https://vono.dev
 * ──────────────────────────────────────────────────────────────
 */

import { Hono } from 'hono'
import type { AppVariables } from '../../types'
import { authMiddleware, isAdmin } from '../../shared/middleware/auth.middleware'
import { LoggingService } from './logging.service'

const loggingRoutes = new Hono<{ Variables: AppVariables }>()

loggingRoutes.use('*', authMiddleware, isAdmin)

loggingRoutes.get('/', async (c) => {
  const logger = new LoggingService(c.get('db'))
  const query = c.req.query()
  const data = await logger.list({
    userId: query.userId ? Number(query.userId) : undefined,
    action: query.action,
    resource: query.resource,
    page: query.page ? Number(query.page) : 1,
    perPage: query.perPage ? Number(query.perPage) : 50,
  })
  return c.json(success('Activity logs retrieved', data))
})

export { loggingRoutes }
```

### 26.7 Using the Logger from Any Service

```ts
// Example: Auth service logging login events
import { LoggingService } from '../logging/logging.service'

export class AuthService {
  private logger: LoggingService

  constructor(private db: any, private queue: any | null = null) {
    this.logger = new LoggingService(db, queue)
  }

  async login(email: string, password: string, ip: string) {
    // ... validate credentials, generate tokens ...

    // Log the event (async via queue if available, else sync)
    await this.logger.log({
      userId: user.id,
      userEmail: email,
      ipAddress: ip,
      action: 'user.login',
      resource: 'users',
      resourceId: String(user.id),
      description: 'User logged in successfully',
    })

    return { accessToken, refreshToken, user }
  }

  async failedLogin(email: string, ip: string) {
    await this.logger.log({
      ipAddress: ip,
      action: 'user.login_failed',
      resource: 'users',
      description: `Failed login attempt for ${email}`,
      metadata: { email },
    })
  }
}
```

### 26.8 Common Action Constants

```ts
// src/modules/logging/logging.actions.ts — generated as a starting point
export const LogActions = {
  // Auth
  USER_LOGIN: 'user.login',
  USER_LOGIN_FAILED: 'user.login_failed',
  USER_REGISTER: 'user.register',
  USER_LOGOUT: 'user.logout',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_PASSWORD_CHANGED: 'user.password_changed',
  USER_PROFILE_UPDATED: 'user.profile_updated',

  // Resources (extend per module)
  RESOURCE_CREATED: (resource: string) => `${resource}.created`,
  RESOURCE_UPDATED: (resource: string) => `${resource}.updated`,
  RESOURCE_DELETED: (resource: string) => `${resource}.deleted`,

  // Admin
  ADMIN_ACTION: 'admin.action',
  ADMIN_USER_SUSPENDED: 'admin.user_suspended',
} as const
```

### 26.9 Logging Middleware (Auto-Log All Requests)

Optionally, Vono can generate a request-logging middleware that auto-logs every API call:

```ts
// src/shared/middleware/request-logger.middleware.ts
import { LoggingService } from '../../modules/logging/logging.service'

export function requestLogger() {
  return async (c: any, next: any) => {
    const start = Date.now()
    await next()
    const duration = Date.now() - start

    // Only log mutations (POST/PUT/PATCH/DELETE) to avoid noise
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
      const logger = new LoggingService(c.get('db'), c.get('queue') ?? null)
      await logger.log({
        userId: c.get('userId'),
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        action: `api.${c.req.method.toLowerCase()}`,
        resource: c.req.path,
        description: `${c.req.method} ${c.req.path} → ${c.res.status} (${duration}ms)`,
        metadata: { method: c.req.method, path: c.req.path, status: c.res.status, duration },
      })
    }
  }
}
```

### 26.10 Logging Summary

| Feature | Queue available | No queue |
|---|---|---|
| **Dispatch method** | `queue.dispatch('log-activity', event)` | `db.insert(activityLogs, event)` |
| **Performance impact** | ~0ms (fire-and-forget to queue) | ~5-15ms (DB round-trip) |
| **Failure handling** | Queue retries (3x exponential backoff) | Console error, request unaffected |
| **Log persistence** | Background worker writes to DB | Inline during request |

| Generated artifact | Path | Purpose |
|---|---|---|
| **Schema** | `logging.schema.ts` | `activity_logs` table |
| **Service** | `logging.service.ts` | `log()` + `persist()` + `list()` + `cleanup()` |
| **Queue job** | `jobs/log-activity.job.ts` | Background persistence worker |
| **Routes** | `logging.routes.ts` | Admin API for viewing logs |
| **Controller** | `logging.controller.ts` | Request handling |
| **Actions** | `logging.actions.ts` | Constant action names |
| **Middleware** | `request-logger.middleware.ts` | Optional auto-log all mutations |

---

## 27. Vite Plugin — Framework Core

The Vite plugin is the heart of Vono. It reads `vono.config.ts` and configures everything automatically.

### Usage

Users write a minimal `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import { vono } from 'vono/vite'

export default defineConfig({
  plugins: [vono()],
})
```

The plugin internally composes:
- `@vitejs/plugin-vue` — Vue SFC compilation
- `unplugin-vue-router/vite` — file-based routing from `*.page.vue`
- `unplugin-auto-import/vite` — auto-imports for server & client
- `unplugin-vue-components/vite` — Vue component auto-registration
- `@hono/vite-dev-server` — Hono dev server with HMR
- `@nuxt/ui/vite` — Nuxt UI component library
- Custom virtual modules for config resolution

### What the plugin does:

1. **Reads `vono.config.ts`** and resolves runtime/deployment target
2. **Configures SSR** — sets `ssr.noExternal`, `ssr.external` based on target
3. **Wires file-based routing** — scans `src/modules/**/pages/*.page.vue`
4. **Sets up auto-imports** — server imports (Hono, Drizzle) + client imports (Vue, composables)
5. **Injects virtual modules:**
   - `virtual:vono/config` — resolved config values
   - `virtual:vono/routes` — auto-discovered file routes
   - `virtual:vono/modules` — registered module metadata
6. **Configures dev server** — Hono dev server with `ssrLoadModule` for proper HMR on API routes
7. **Handles build** — dual build (client + SSR) with manifest generation for asset preloading
8. **Resolves aliases** — `@@ws-adapter` → correct WebSocket adapter based on config

### Build pipeline (replaces manual two-step):

```ts
// Internal build steps (handled by vono plugin):
// 1. Client build → dist/client/ (with ssrManifest for preloading)
// 2. SSR build → dist/server/ (server entry bundled for target runtime)
// 3. Generate dist/server/manifest.json (maps routes to CSS/JS assets)
// 4. Target-specific post-processing (e.g., wrangler.toml for CF Workers)
```

### Dev server HMR:

```ts
// The plugin uses Vite's ssrLoadModule for server code HMR:
// - API route changes → hot-reload without full restart
// - Vue component changes → standard Vite HMR
// - vono.config.ts changes → full dev server restart
```

### Edge-compatible server entry:

The plugin generates a production server entry that avoids Node-only APIs:

```ts
// ❌ Current (broken on edge):
// const template = readFileSync('./dist/client/index.html', 'utf-8')

// ✅ Fixed (works everywhere):
// Template is inlined during build as a string constant
// Asset manifest is imported from the generated manifest module
```

---

## 28. Vono Composables — Client Runtime

Vono provides its own composables that work in vanilla Vue (no Nuxt required). These are auto-imported from `vono/client`.

### `useAsyncData(key, fetcher, options?)`

SSR-safe data fetching with deduplication. Fetches on server during SSR, hydrates on client.

```ts
// In any Vue component or page
const { data, pending, error, refresh } = useAsyncData(
  'users',
  () => useVonoFetch<User[]>('/api/v1/users')
)
```

**How it works:**
- **During SSR:** Calls `fetcher()`, stores result in SSR payload, renders with data
- **During hydration:** Reads data from SSR payload (no duplicate fetch)
- **Client navigation:** Calls `fetcher()` on the client
- **Deduplication:** Same `key` across components → single fetch

```ts
interface UseAsyncDataOptions<T> {
  server?: boolean        // Run on server? (default: true)
  lazy?: boolean          // Don't block navigation (default: false)
  immediate?: boolean     // Fetch immediately (default: true)
  default?: () => T       // Default value factory
  watch?: WatchSource[]   // Re-fetch when these change
  transform?: (data: T) => T  // Transform response
}

interface UseAsyncDataReturn<T> {
  data: Ref<T | null>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refresh: () => Promise<void>
  clear: () => void
}
```

### `useVonoFetch(url, options?)`

Typed fetch wrapper. Uses relative URLs on server (via internal fetch), absolute on client. Automatically includes auth cookies/headers.

```ts
// Auto-imported — no import needed
const users = await useVonoFetch<{ success: boolean; data: User[] }>('/api/v1/users', {
  method: 'GET',
  query: { page: 1, limit: 20 },
})
```

**Features:**
- Automatically prepends base URL on client
- Forwards cookies during SSR (request passthrough)
- Returns typed responses
- Integrates with Vono's standard API response format

### `useCookie(name, options?)`

SSR-safe cookie access. Reads from request headers on server, `document.cookie` on client.

```ts
const token = useCookie<string>('auth_token', {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  httpOnly: false,           // Must be false for client-readable cookies
  secure: true,
  sameSite: 'lax',
})

// Read
console.log(token.value)

// Write (sets cookie on both server response and client)
token.value = 'new-token'

// Delete
token.value = null
```

### `useState<T>(key, init?)`

SSR-safe shared state. Like `ref()` but survives SSR → client hydration and is shared across components.

```ts
// In any component — same key = same state instance
const user = useState<User | null>('current-user', () => null)

// Set from anywhere
user.value = { id: 1, name: 'Fade' }
```

**How it works:**
- State is stored in an SSR payload object
- During SSR, state is serialized into `<script>window.__VONO_STATE__=...</script>`
- During hydration, state is restored from the payload
- After hydration, it behaves like a normal shared `ref()`

### `navigateTo(path, options?)`

Programmatic navigation helper wrapping `vue-router`.

```ts
// Client-side navigation
await navigateTo('/dashboard')

// With options
await navigateTo('/login', { replace: true })

// External redirect
await navigateTo('https://google.com', { external: true })

// During SSR (sends 302 redirect)
await navigateTo('/login', { redirectCode: 302 })
```

### `useRuntimeConfig()`

Access resolved Vono config values. Server-only values are stripped on client.

```ts
const config = useRuntimeConfig()

// Client-safe values
config.public.appName    // from vono.config.ts → app.name
config.public.apiBaseUrl // from vono.config.ts → app.apiBaseUrl

// Server-only (throws on client)
config.databaseUrl       // from env
config.jwtSecret         // from env
```

---

## 29. Plugin / Module System — `defineVonoModule()`

Vono modules are installable packages that can register middleware, auto-imports, schemas, routes, pages, and composables. This is how `@vono/auth`, `@vono/notifications`, etc. are built.

### Defining a module

```ts
// @vono/auth/src/index.ts
import { defineVonoModule } from 'vono'

export default defineVonoModule({
  name: 'auth',
  version: '1.0.0',

  // Dependencies on other modules
  requires: [],

  // Hono middleware to register globally
  middleware: [
    { path: '/api/*', handler: './middleware/auth.middleware.ts' },
  ],

  // Drizzle schemas to merge into db/schema.ts
  schemas: ['./db/users.schema.ts', './db/sessions.schema.ts'],

  // Server-side auto-imports
  serverImports: [
    { from: '@vono/auth/server', imports: ['requireAuth', 'requireRole', 'getCurrentUser'] },
  ],

  // Client-side auto-imports
  clientImports: [
    { from: '@vono/auth/client', imports: ['useAuth', 'useUser'] },
  ],

  // Vue pages to register (file-based routing)
  pages: {
    'auth/login': './pages/login.page.vue',
    'auth/register': './pages/register.page.vue',
    'auth/forgot-password': './pages/forgot-password.page.vue',
    'auth/reset-password': './pages/reset-password.page.vue',
  },

  // Vue components to auto-register
  components: ['./components/AuthGuard.vue'],

  // Hono API routes to mount
  routes: {
    '/api/v1/auth': './routes/auth.routes.ts',
  },

  // Migrations
  migrations: ['./db/migrations/'],

  // Config schema (merged into VonoConfig)
  configSchema: {
    auth: {
      providers: ['email', 'google', 'github'],
      jwtExpiresIn: '7d',
      otpLength: 6,
      magicLinkEnabled: false,
      roles: { enabled: false, multiple: false },
    },
  },

  // Setup hook — runs during app initialization
  setup(vono) {
    // Access resolved config, register hooks, etc.
  },
})
```

### Using modules in `vono.config.ts`

```ts
import { defineVonoConfig } from 'vono'
import auth from '@vono/auth'
import notifications from '@vono/notifications'
import logging from '@vono/logging'

export default defineVonoConfig({
  modules: [
    auth({ providers: ['email', 'google'], roles: { enabled: true, multiple: true } }),
    notifications(),
    logging({ queue: true }),
  ],
  // ...rest of config
})
```

### Ejecting a module

When you need full control, eject a module to copy its source into your project:

```bash
vono add auth --eject
# Copies @vono/auth source into src/modules/auth/
# Removes @vono/auth from dependencies
# Updates vono.config.ts to remove module registration
```

After ejecting, the code is fully yours — no more automatic updates from the package.

### Module lifecycle hooks

```ts
defineVonoModule({
  hooks: {
    'app:created': (app) => { /* Hono app created, before routes mounted */ },
    'app:ready': (app) => { /* All routes mounted, server about to listen */ },
    'build:before': (config) => { /* Modify Vite config before build */ },
    'build:after': (manifest) => { /* Post-build processing */ },
    'routes:resolved': (routes) => { /* Modify resolved routes */ },
  },
})
```

---

## 30. SSR Error Handling & Error Pages

### SSR Error Boundary

If `renderToString` throws during SSR, the server MUST NOT crash. Vono wraps SSR in a try/catch:

```ts
// Internal SSR handler (inside vono core)
async function handleSSR(c: Context, url: string): Promise<Response> {
  try {
    const { html, state, head } = await renderPage(c, url)
    return c.html(injectToTemplate(html, state, head))
  } catch (error) {
    // Log the error
    console.error(`[vono:ssr] Error rendering ${url}:`, error)

    // Option 1: Fall back to SPA shell (graceful degradation)
    if (vonoConfig.ssr.fallbackToSpa) {
      return c.html(getSpaShell(url))
    }

    // Option 2: Render the error page via SSR
    try {
      const errorHtml = await renderErrorPage(c, error, url)
      return c.html(errorHtml, error.statusCode || 500)
    } catch {
      // Option 3: Static error HTML (last resort)
      return c.html(getStaticErrorHtml(500), 500)
    }
  }
}
```

### Error page convention

```
src/
├── error.vue              # Global error page (catches all unhandled errors)
├── modules/
│   └── shared/
│       └── pages/
│           ├── 404.page.vue    # Not Found page
│           └── 500.page.vue    # Server Error page (optional)
```

### `error.vue` — Global Error Page

```vue
<script setup lang="ts">
interface Props {
  error: {
    statusCode: number
    message: string
    stack?: string // Only in development
    url?: string
  }
}

const props = defineProps<Props>()

const handleClearError = () => {
  // Navigate home and clear the error
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-6xl font-bold">{{ error.statusCode }}</h1>
      <p class="mt-4 text-lg text-gray-600">{{ error.message }}</p>
      <UButton class="mt-6" @click="handleClearError">
        Go Home
      </UButton>
    </div>
  </div>
</template>
```

### `clearError()` and `createError()`

```ts
// Throw an error from any composable or page setup
throw createError({
  statusCode: 404,
  message: 'Page not found',
})

// Clear the current error and optionally redirect
clearError({ redirect: '/' })
```

---

## 31. Environment Validation — Zod-Powered Env Safety

Vono validates ALL environment variables at startup using Zod. No more runtime crashes from missing env vars.

### Define env schema in `vono.config.ts`

```ts
import { defineVonoConfig } from 'vono'
import { z } from 'zod'

export default defineVonoConfig({
  env: {
    schema: {
      // Required — app crashes at startup if missing
      DATABASE_URL: z.string().url(),
      JWT_SECRET: z.string().min(32),

      // Optional with defaults
      PORT: z.coerce.number().default(4000),
      NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
      LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

      // Conditional — only required when feature is enabled
      GOOGLE_CLIENT_ID: z.string().optional(),
      GOOGLE_CLIENT_SECRET: z.string().optional(),
      GITHUB_CLIENT_ID: z.string().optional(),
      GITHUB_CLIENT_SECRET: z.string().optional(),

      // Storage
      R2_ACCOUNT_ID: z.string().optional(),
      R2_ACCESS_KEY: z.string().optional(),
      CLOUDINARY_URL: z.string().url().optional(),

      // Email
      RESEND_API_KEY: z.string().optional(),
    },

    // Validate cross-field dependencies
    refine: (env) => {
      if (env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_SECRET) {
        throw new Error('GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set')
      }
    },
  },
})
```

### Startup validation

```
$ bun run dev

🔴 Environment validation failed:

  DATABASE_URL: Required
  JWT_SECRET: String must contain at least 32 character(s) (received 8)

💡 Copy .env.example to .env and fill in the values:
   cp .env.example .env
```

### Auto-generated `.env.example`

When running `vono add auth`, the CLI automatically appends required env vars to `.env.example`:

```bash
# Auth (added by @vono/auth)
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Type-safe env access

```ts
// In server code — fully typed from your Zod schema
const db = c.var.config.DATABASE_URL  // string (validated)
const port = c.var.config.PORT        // number (coerced and validated)
```

---

## 32. Database Connection Pooling

Vono uses connection pooling by default. The strategy adapts based on the deployment target.

### Connection strategy by target

| Target | Strategy | Implementation |
|---|---|---|
| **Node.js / Bun** | Connection pool via `postgres` (postgres.js) | Pool of 10-20 connections, shared across requests |
| **Cloudflare Workers** | Hyperdrive (connection pooler) | Single connection per request, pooled by Hyperdrive |
| **Vercel Serverless** | `@vercel/postgres` or Neon serverless driver | HTTP-based, connection per query |
| **Deno Deploy** | Neon serverless driver | HTTP-based |

### Configuration in `vono.config.ts`

```ts
export default defineVonoConfig({
  database: {
    driver: 'postgres',  // 'postgres' | 'mysql' | 'sqlite' | 'turso'
    pool: {
      min: 2,            // Minimum connections (Node/Bun only)
      max: 20,           // Maximum connections (Node/Bun only)
      idleTimeout: 30,   // Seconds before idle connection is closed
    },
  },
})
```

### Implementation

```ts
// Internal: src/db/index.ts (generated, but uses vono core)
import { createDbClient } from 'vono/server'
import * as schema from './schema'

// Creates a POOLED client for Node/Bun, single client for edge
export const db = createDbClient({ schema })
```

The `dbProvider` middleware attaches the shared pool (NOT per-request):

```ts
// ❌ Old (per-request — performance killer):
// app.use('*', async (c, next) => {
//   const client = postgres(env.DATABASE_URL)
//   c.set('db', drizzle(client, { schema }))
//   await next()
// })

// ✅ New (shared pool):
import { db } from '../db'

app.use('*', async (c, next) => {
  c.set('db', db)  // Same pooled instance for all requests
  await next()
})
```

---

## 33. Database Transactions

Drizzle ORM supports transactions natively. Vono provides a convenience helper.

### Basic transaction

```ts
import { db } from '../../db'

// Using Drizzle's native transaction API
const result = await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({
    email: 'user@example.com',
    name: 'New User',
  }).returning()

  await tx.insert(profiles).values({
    userId: user.id,
    bio: '',
  })

  return user
})
```

### Transaction with rollback

```ts
await db.transaction(async (tx) => {
  await tx.insert(orders).values(orderData)
  await tx.insert(orderItems).values(itemsData)

  const [balance] = await tx
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))

  if (balance.amount < orderTotal) {
    tx.rollback()  // Rolls back ALL operations in this transaction
    return
  }

  await tx
    .update(wallets)
    .set({ amount: sql`amount - ${orderTotal}` })
    .where(eq(wallets.userId, userId))
})
```

### Service-layer pattern

```ts
// In a service, accept tx OR db for flexibility
class OrderService {
  async createOrder(
    dbOrTx: DrizzleDB | DrizzleTransaction,
    data: CreateOrderDTO
  ) {
    // Works with both regular db and transaction context
    return dbOrTx.insert(orders).values(data).returning()
  }
}
```

---

## 34. CORS Configuration

CORS is configured in `vono.config.ts` — not hardcoded in middleware.

### Configuration

```ts
export default defineVonoConfig({
  server: {
    cors: {
      origin: ['https://myapp.com', 'https://admin.myapp.com'],
      // Or use a function for dynamic origins:
      // origin: (origin) => origin.endsWith('.myapp.com'),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      exposeHeaders: ['X-Total-Count', 'X-Request-Id'],
      credentials: true,
      maxAge: 86400, // 24 hours preflight cache
    },
  },
})
```

### Environment-based CORS

```ts
export default defineVonoConfig({
  server: {
    cors: {
      origin: process.env.NODE_ENV === 'development'
        ? ['http://localhost:3000', 'http://localhost:5173']
        : ['https://myapp.com'],
      credentials: true,
    },
  },
})
```

Internally, this uses Hono's built-in `cors()` middleware — the config is simply passed through.

---

## 35. File Uploads & Storage

Vono provides a storage abstraction layer supporting multiple drivers. File upload handling uses Hono's built-in multipart parser.

### Storage drivers

| Driver | Config key | Use case |
|---|---|---|
| `local` | `storage.driver: 'local'` | Development, self-hosted |
| `r2` | `storage.driver: 'r2'` | Cloudflare R2 (S3-compatible) |
| `s3` | `storage.driver: 's3'` | AWS S3 |
| `cloudinary` | `storage.driver: 'cloudinary'` | Image/video optimization |
| `bunny` | `storage.driver: 'bunny'` | Bunny.net CDN storage |

### Configuration

```ts
export default defineVonoConfig({
  storage: {
    driver: 'r2',
    drivers: {
      local: {
        root: './storage/uploads',
        servePrefix: '/uploads',
      },
      r2: {
        accountId: process.env.R2_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
        bucket: 'my-app-uploads',
      },
      s3: {
        region: process.env.AWS_REGION,
        bucket: process.env.S3_BUCKET,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
      },
      bunny: {
        apiKey: process.env.BUNNY_API_KEY,
        storageZone: process.env.BUNNY_STORAGE_ZONE,
        cdnUrl: process.env.BUNNY_CDN_URL,
      },
    },
  },
})
```

### Upload handler

```ts
import { useStorage } from 'vono/server'

export const uploadRoutes = new Hono()

uploadRoutes.post('/upload', authMiddleware, async (c) => {
  const body = await c.req.parseBody()
  const file = body['file'] as File

  if (!file) {
    return error(c, 'No file provided', 400)
  }

  // Validate file
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return error(c, 'File too large (max 10MB)', 413)
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return error(c, 'File type not allowed', 415)
  }

  // Upload using the configured storage driver
  const storage = useStorage(c)
  const result = await storage.upload(file, {
    folder: 'avatars',
    filename: `${c.var.user.id}-${Date.now()}`, // Custom filename
  })

  return success(c, 'File uploaded', {
    url: result.url,
    key: result.key,
    size: result.size,
    mimeType: result.mimeType,
  })
})

// Delete a file
uploadRoutes.delete('/upload/:key', authMiddleware, async (c) => {
  const storage = useStorage(c)
  await storage.delete(c.req.param('key'))
  return success(c, 'File deleted')
})
```

---

## 36. Cron / Scheduled Jobs

Vono supports scheduled tasks that run on a cron schedule. The implementation adapts based on the deployment target.

### Defining a cron job

```ts
// src/modules/billing/jobs/check-expired-trials.job.ts
import { defineJob } from 'vono/server'

export default defineJob({
  name: 'check-expired-trials',
  schedule: '0 0 * * *',  // Daily at midnight (cron syntax)
  description: 'Deactivate expired trial accounts',

  async handler({ db, config, logger }) {
    const expiredTrials = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.plan, 'trial'),
          lt(subscriptions.expiresAt, new Date()),
          isNull(subscriptions.deletedAt)
        )
      )

    for (const trial of expiredTrials) {
      await db
        .update(subscriptions)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(subscriptions.id, trial.id))

      logger.info(`Trial expired for user ${trial.userId}`)
    }

    return { processed: expiredTrials.length }
  },
})
```

### Runtime behavior

| Target | Implementation |
|---|---|
| **Node.js / Bun** | `node-cron` — runs in the same process |
| **Cloudflare Workers** | Cron Triggers via `wrangler.toml` `[triggers]` |
| **Vercel** | Vercel Cron via `vercel.json` crons config |

### CLI commands

```bash
# List all registered jobs
vono jobs:list

# Run a job manually
vono jobs:run check-expired-trials

# Scaffold a new job
vono make:job send-weekly-reports --module=reports --schedule="0 9 * * MON"
```

---

## 37. Email Templates

Vono uses a simple, framework-agnostic email system. Templates are TypeScript functions that return HTML strings. Emails are sent via the configured provider.

### Email providers

| Provider | Config key | Package |
|---|---|---|
| Resend | `email.driver: 'resend'` | `resend` |
| Postmark | `email.driver: 'postmark'` | `postmark` |
| SMTP | `email.driver: 'smtp'` | `nodemailer` |
| Console | `email.driver: 'console'` | Built-in (dev only) |

### Configuration

```ts
export default defineVonoConfig({
  email: {
    driver: 'resend',
    from: 'Vono App <hello@myapp.com>',
    replyTo: 'support@myapp.com',
    drivers: {
      resend: { apiKey: process.env.RESEND_API_KEY },
      smtp: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      },
    },
  },
})
```

### Defining an email template

```ts
// src/modules/auth/emails/welcome.email.ts
import { defineEmail } from 'vono/server'

export const WelcomeEmail = defineEmail({
  subject: (data: { name: string }) => `Welcome to MyApp, ${data.name}!`,

  html: (data: { name: string; loginUrl: string }) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Welcome, ${data.name}! 👋</h1>
      <p>Thanks for joining. Click below to get started:</p>
      <a href="${data.loginUrl}"
         style="display: inline-block; padding: 12px 24px;
                background: #4F46E5; color: white; border-radius: 8px;
                text-decoration: none;">
        Go to Dashboard
      </a>
    </div>
  `,

  text: (data: { name: string; loginUrl: string }) =>
    `Welcome, ${data.name}! Visit ${data.loginUrl} to get started.`,
})
```

### Sending email

```ts
import { sendEmail } from 'vono/server'
import { WelcomeEmail } from '../emails/welcome.email'

// Send immediately
await sendEmail(c, {
  to: user.email,
  ...WelcomeEmail.render({ name: user.name, loginUrl: 'https://myapp.com/login' }),
})

// Send via queue (if queue is configured)
await sendEmail(c, {
  to: user.email,
  ...WelcomeEmail.render({ name: user.name, loginUrl: 'https://myapp.com/login' }),
  queue: true,  // Dispatches to queue instead of sending immediately
})
```

---

## 38. i18n / Localization

Vono provides optional i18n support via the `@vono/i18n` module.

### Installation

```bash
vono add i18n
```

### Configuration

```ts
export default defineVonoConfig({
  modules: [
    i18n({
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es', 'de'],
      strategy: 'prefix',       // URL prefix: /fr/about, /es/about
      // strategy: 'cookie',    // Detect from cookie
      // strategy: 'header',    // Detect from Accept-Language header
      lazy: true,                // Load translations on demand
      fallbackLocale: 'en',
    }),
  ],
})
```

### Translation files

```
src/
├── locales/
│   ├── en.json           # { "welcome": "Welcome", "nav.home": "Home" }
│   ├── fr.json           # { "welcome": "Bienvenue", "nav.home": "Accueil" }
│   └── es.json
```

### Usage in Vue components

```vue
<script setup lang="ts">
const { t, locale, setLocale, availableLocales } = useI18n()
</script>

<template>
  <h1>{{ t('welcome') }}</h1>
  <nav>
    <a href="/">{{ t('nav.home') }}</a>
  </nav>

  <!-- Language switcher -->
  <select :value="locale" @change="setLocale(($event.target as HTMLSelectElement).value)">
    <option v-for="loc in availableLocales" :key="loc" :value="loc">
      {{ loc.toUpperCase() }}
    </option>
  </select>
</template>
```

### Usage in API responses

```ts
// Server-side: detect locale from request
import { getLocale, t } from 'vono/server'

app.get('/api/v1/greeting', (c) => {
  const locale = getLocale(c)  // From cookie, header, or URL prefix
  return success(c, t(locale, 'welcome'))
})
```

---

## 39. Layout System

Vono uses a layout system similar to Nuxt. Layouts are Vue components that wrap page content.

### Defining layouts

```
src/
├── shared/
│   └── layouts/
│       ├── default.vue        # Default layout (navbar + footer)
│       ├── auth.vue           # Auth layout (centered card)
│       ├── dashboard.vue      # Dashboard layout (sidebar + topbar)
│       └── blank.vue          # No layout (just the page)
```

### Layout component structure

```vue
<!-- src/shared/layouts/default.vue -->
<script setup lang="ts">
// Layout-level logic (e.g., fetch user, check auth)
</script>

<template>
  <div class="min-h-screen">
    <AppNavbar />
    <main class="container mx-auto px-4 py-8">
      <slot />  <!-- Page content renders here -->
    </main>
    <AppFooter />
  </div>
</template>
```

### Assigning layouts to pages

```vue
<!-- src/modules/auth/pages/login.page.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'auth',  // Uses src/shared/layouts/auth.vue
})
</script>
```

### Layout resolution

The `<LayoutResolver>` component in `App.vue` handles layout switching:

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { resolveLayout } from 'vono/client'

const route = useRoute()
const layout = computed(() => resolveLayout(route.meta.layout || 'default'))
</script>

<template>
  <UApp>
    <component :is="layout">
      <RouterView />
    </component>
  </UApp>
</template>
```

Layouts are auto-imported from `src/shared/layouts/` — no manual registration needed.

---

## 40. Upgrade & Versioning Strategy

### Semantic Versioning

Vono follows strict semver:
- **Patch (0.1.x):** Bug fixes, no API changes
- **Minor (0.x.0):** New features, backward compatible
- **Major (x.0.0):** Breaking changes (with migration guide)

### Upgrade workflow

```bash
# Check for updates
vono upgrade --check

# Upgrade to latest
bun update vono @vono/cli @vono/drizzle

# Run codemods for breaking changes (major versions)
vono upgrade --apply-codemods
```

### Codemods

For major version upgrades, Vono provides automated codemods:

```bash
# Example: Upgrade from v1 to v2
vono upgrade --from=1 --to=2

# This runs:
# ✅ Renamed defineVonoConfig() → defineConfig() in vono.config.ts
# ✅ Moved middleware/ to shared/middleware/
# ✅ Updated import paths from 'vono/helpers' to 'vono/server'
# ⚠️  Manual: Review updated CORS config format
```

### Changelog

Every release includes:
- What changed (features, fixes, breaking changes)
- Migration steps for breaking changes
- Links to relevant documentation

### Module versioning

Modules (`@vono/auth`, etc.) are versioned independently but declare compatible `vono` peer dependency ranges:

```json
{
  "peerDependencies": {
    "vono": "^1.0.0"
  }
}
```

---
- [Vue SSR API](https://vuejs.org/api/ssr) — `renderToString`, `renderToWebStream`, `useSSRContext`
- [Nuxt Rendering Modes](https://nuxt.com/docs/guide/concepts/rendering) — The `routeRules` concept this mirrors
- [Vite SSR Guide](https://vite.dev/guide/ssr) — Low-level SSR with Vite (middleware mode, dual build)
- [Hono.js Getting Started](https://hono.dev/docs/getting-started/basic) — All deployment targets
- [Hono.js Node.js](https://hono.dev/docs/getting-started/nodejs) — `serveStatic`, `serve`
- [Hono.js JSX/HTML](https://hono.dev/docs/guides/jsx) — `c.html()`, streaming
- [@hono/vite-dev-server](https://www.npmjs.com/package/@hono/vite-dev-server) — Vite plugin
- [@unhead/vue](https://unhead.unjs.io/) — The same head manager Nuxt uses
- [Drizzle ORM — Get Started](https://orm.drizzle.team/docs/get-started) — All database drivers
- [Nuxt UI — Vue (Vite)](https://ui.nuxt.com/getting-started/installation/vue) — Standalone Vue usage
- [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import) — Auto-import plugin
- [BullMQ](https://bullmq.io/) — Redis-backed queue for Node/Bun
- [Upstash Redis](https://upstash.com/) — Serverless Redis for edge runtimes
- [Cloudflare Queues](https://developers.cloudflare.com/queues/) — CF-native queue
- [@clack/prompts](https://github.com/bombshell-dev/clack) — CLI prompt library
- [SelfhostedPro/hono-vue-vite-ssr](https://github.com/SelfhostedPro/hono-vue-vite-ssr) — Reference implementation
- [PM2 Configuration File](https://pm2.keymetrics.io/docs/usage/application-declaration/) — Ecosystem config attributes
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/) — Node.js load balancing
- [PM2 Quick Start](https://pm2.keymetrics.io/docs/usage/quick-start/) — Installation & basic usage
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration) — Image upload & transformation
- [Bunny.net Storage API](https://docs.bunny.net/reference/storage-api) — CDN file storage REST API
- [AWS S3 SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/) — `@aws-sdk/client-s3`
