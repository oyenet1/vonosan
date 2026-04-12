/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { WizardAnswers } from './wizard.js'

const HEADER = (date: string) => `/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: ${date}
 * 🔄 Updated Date: ${date}
 * ──────────────────────────────────────────────────────────────────
 */`

export function generateTemplates(answers: WizardAnswers): Record<string, string> {
  const date = new Date().toISOString().slice(0, 10)
  const h = HEADER(date)
  const {
    projectName,
    deploymentTarget,
    database,
    auth,
    apiDocs,
    saas,
    testing,
    queue,
    queueRedisDriver,
    cache,
    websocket,
    websocketDriver,
  } = answers
  const isApiOnly = answers.projectType === 'api'
  const isDockerTarget = deploymentTarget === 'bun-docker' || deploymentTarget === 'nodejs-docker'
  const dockerRuntime = deploymentTarget === 'nodejs-docker' ? 'nodejs' : 'bun'
  const runtimeTarget =
    deploymentTarget === 'nodejs' || deploymentTarget === 'nodejs-docker'
      ? 'node'
      : deploymentTarget === 'bun-docker'
        ? 'bun'
        : deploymentTarget
  const fullstackStartCommand =
    deploymentTarget === 'nodejs' || deploymentTarget === 'nodejs-docker'
      ? 'node dist/server/index.js'
      : 'bun dist/server/index.js'
  const apiStartCommand =
    deploymentTarget === 'nodejs' || deploymentTarget === 'nodejs-docker'
      ? 'node dist/index.js'
      : 'bun dist/index.js'
  const startCommand = isApiOnly ? apiStartCommand : fullstackStartCommand
  const apiDevCommand =
    deploymentTarget === 'bun' || deploymentTarget === 'bun-docker'
      ? 'bun --watch index.ts'
      : 'tsx watch index.ts'
  const needsIoredis =
    cache === 'ioredis' ||
    (queue === 'bullmq' && (queueRedisDriver === 'ioredis' || queueRedisDriver === 'upstash-redis'))
  const needsRedisClient = queue === 'bullmq' && queueRedisDriver === 'redis'
  const needsUpstashRedis = cache === 'upstash'
  const needsSocketIo = websocketDriver === 'socket.io'
  const needsNativeWs = websocketDriver === 'native'
  const isBunRuntimeTarget = deploymentTarget === 'bun' || deploymentTarget === 'bun-docker'
  const isNodeRuntimeTarget = deploymentTarget === 'nodejs' || deploymentTarget === 'nodejs-docker'
  const isCloudflareRuntimeTarget =
    deploymentTarget === 'cloudflare-workers' || deploymentTarget === 'cloudflare-pages'
  const isDenoRuntimeTarget = deploymentTarget === 'deno'
  const needsSocketIoBunEngine = needsSocketIo && isBunRuntimeTarget
  const needsNodeWebSocketAdapter = needsNativeWs && isNodeRuntimeTarget
  const usesPostgresJs = ['postgres', 'neon', 'supabase', 'vercel-postgres', 'xata'].includes(database)
  const usesCockroach = database === 'cockroachdb'
  const usesMysql = database === 'mysql'
  const usesSingleStore = database === 'singlestore'
  const usesLibsql = database === 'sqlite' || database === 'turso'
  const usesMssql = database === 'mssql'
  const usesD1 = database === 'd1'
  const drizzleDialect =
    usesPostgresJs
      ? 'postgresql'
      : usesCockroach
        ? 'cockroachdb'
        : usesMysql
          ? 'mysql'
          : usesSingleStore
            ? 'singlestore'
            : usesMssql
              ? 'mssql'
              : database === 'turso'
                ? 'turso'
                : 'sqlite'
  const defaultDatabaseUrl =
    usesPostgresJs || usesCockroach
      ? `postgresql://postgres:password@localhost:5432/${projectName.replace(/-/g, '_')}`
      : usesMysql || usesSingleStore
        ? `mysql://root:password@localhost:3306/${projectName.replace(/-/g, '_')}`
        : usesMssql
          ? `sqlserver://localhost:1433;database=${projectName.replace(/-/g, '_')};user=sa;password=YourStrong@Passw0rd;encrypt=true;trustServerCertificate=true`
          : usesLibsql
            ? (database === 'turso' ? 'libsql://your-db.turso.io' : 'file:./sqlite.db')
            : 'file:./sqlite.db'
  const dbEnvBlock = usesD1
    ? `D1_ACCOUNT_ID=
D1_DATABASE_ID=
D1_TOKEN=
`
    : `DATABASE_URL=${defaultDatabaseUrl}
${usesLibsql ? 'DATABASE_AUTH_TOKEN=\n' : ''}`
  const drizzleCredentialsBlock = usesD1
    ? `  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.D1_ACCOUNT_ID!,
    databaseId: process.env.D1_DATABASE_ID!,
    token: process.env.D1_TOKEN!,
  },`
    : `  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },`
  const dbBootstrap = usesPostgresJs
    ? `${h}

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

export async function createDb(connectionString: string) {
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })
  return {
    db,
    client: {
      async end() {
        await client.end({ timeout: 5 })
      },
    },
  }
}

export const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
`
    : usesCockroach
      ? `${h}

import { drizzle } from 'drizzle-orm/cockroach'
import { Pool } from 'pg'
import * as schema from './schema.js'

export async function createDb(connectionString: string) {
  const client = new Pool({ connectionString })
  const db = drizzle({ client, schema })
  return {
    db,
    client: {
      async end() {
        await client.end()
      },
    },
  }
}

export const client = new Pool({ connectionString: process.env.DATABASE_URL! })
export const db = drizzle({ client, schema })
`
      : usesMysql
        ? `${h}

import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema.js'

export async function createDb(connectionString: string) {
  const client = mysql.createPool(connectionString)
  const db = drizzle({ client, schema, mode: 'default' })
  return {
    db,
    client: {
      async end() {
        await client.end()
      },
    },
  }
}

export const client = mysql.createPool(process.env.DATABASE_URL!)
export const db = drizzle({ client, schema, mode: 'default' })
`
        : usesSingleStore
          ? `${h}

import { drizzle } from 'drizzle-orm/singlestore'
import mysql from 'mysql2/promise'
import * as schema from './schema.js'

export async function createDb(connectionString: string) {
  const client = mysql.createPool(connectionString)
  const db = drizzle({ client, schema })
  return {
    db,
    client: {
      async end() {
        await client.end()
      },
    },
  }
}

export const client = mysql.createPool(process.env.DATABASE_URL!)
export const db = drizzle({ client, schema })
`
          : usesMssql
            ? `${h}

import { drizzle } from 'drizzle-orm/node-mssql'
import * as schema from './schema.js'

export async function createDb(connectionString: string) {
  const db = drizzle(connectionString, { schema })
  const rawClient = (db as { $client?: { close?: () => Promise<void> } }).$client
  return {
    db,
    client: {
      async end() {
        if (rawClient?.close) await rawClient.close()
      },
    },
  }
}

export const db = drizzle(process.env.DATABASE_URL!, { schema })
export const client = db.$client
`
            : usesLibsql
              ? `${h}

import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema.js'

export async function createDb(connectionString: string) {
  const client = createClient({
    url: connectionString,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })
  const db = drizzle(client, { schema })
  return {
    db,
    client: {
      async end() {
        const close = (client as { close?: () => void }).close
        if (close) close.call(client)
      },
    },
  }
}

export const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
`
              : usesD1
                ? `${h}

import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema.js'

export async function createDb() {
  throw new Error(
    '[vonosan] D1 selected: use createD1Db(env.DB) in your Cloudflare runtime setup.',
  )
}

export function createD1Db(binding: D1Database) {
  return drizzle(binding, { schema })
}

export type AppDb = ReturnType<typeof createD1Db>
`
                : `${h}

export async function createDb() {
  throw new Error('[vonosan] No database driver selected.')
}

export const db = null
export const client = null
`
  const rootServerEntry = needsSocketIo && isBunRuntimeTarget
    ? `${h}

import app from './src/app.js'
import { createBunSocketIOServer } from './src/shared/ws/socketio.server.js'

const port = Number(process.env.PORT ?? 4000)

const bunRef = (globalThis as { Bun?: { serve?: (options: unknown) => unknown } }).Bun

if (typeof bunRef?.serve === 'function') {
  const socket = createBunSocketIOServer(app)

  bunRef.serve({
    port,
    idleTimeout: socket.idleTimeout,
    fetch: socket.fetch,
    websocket: socket.websocket,
  })
} else {
  const { serve } = await import('@hono/node-server')
  serve({
    port,
    fetch: app.fetch,
  })
}

export default app
`
    : needsSocketIo && isNodeRuntimeTarget
      ? `${h}

import app from './src/app.js'
import { attachSocketIOServer } from './src/shared/ws/socketio.server.js'
import type { Server as HTTPServer } from 'node:http'

const port = Number(process.env.PORT ?? 4000)

const { serve } = await import('@hono/node-server')

const httpServer = serve({
  port,
  fetch: app.fetch,
})

attachSocketIOServer(httpServer as unknown as HTTPServer)

export default app
`
      : needsNativeWs && isBunRuntimeTarget
        ? `${h}

import app from './src/app.js'
import { websocket } from './src/shared/ws/native.server.js'

const port = Number(process.env.PORT ?? 4000)

const bunRef = (globalThis as { Bun?: { serve?: (options: unknown) => unknown } }).Bun

if (typeof bunRef?.serve !== 'function') {
  throw new Error('Native WebSocket with Bun target requires Bun runtime.')
}

bunRef.serve({
  port,
  fetch: app.fetch,
  websocket,
})

export default app
`
        : needsNativeWs && isNodeRuntimeTarget
          ? `${h}

import app from './src/app.js'
import { attachNodeWebSocketServer } from './src/shared/ws/native.server.js'
import type { Server as HTTPServer } from 'node:http'

const port = Number(process.env.PORT ?? 4000)

const { serve } = await import('@hono/node-server')

const httpServer = serve({
  port,
  fetch: app.fetch,
})

attachNodeWebSocketServer(httpServer as unknown as HTTPServer)

export default app
`
      : `${h}

import app from './src/app.js'

const port = Number(process.env.PORT ?? 4000)

const bunRef = (globalThis as { Bun?: { serve?: (options: unknown) => unknown } }).Bun

if (typeof bunRef?.serve === 'function') {
  bunRef.serve({
    port,
    fetch: app.fetch,
  })
} else {
  const { serve } = await import('@hono/node-server')
  serve({
    port,
    fetch: app.fetch,
  })
}

export default app
`

  return {
    'vonosan.config.ts': `${h}

import { defineVonosanConfig } from 'vonosan'

export default defineVonosanConfig({
  app: {
    name: '${projectName}',
    url: process.env.APP_URL ?? 'http://localhost:4000',
    env: process.env.NODE_ENV ?? 'development',
    key: process.env.APP_KEY ?? 'change-me',
    language: 'ts',
  },
  runtime: '${runtimeTarget}',
  mode: '${answers.projectType}',
  ${saas ? 'saas: true,' : ''}
  ${apiDocs ? `docs: {
    swagger: true,
    fiberplane: false,
    scalar: true,
    openapi: '/api/openapi.json',
  },` : ''}
  ${testing !== 'none' ? `test: { driver: '${testing}' },` : ''}
})
`,

    ...(!isApiOnly
      ? {
          'vite.config.ts': `${h}

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { vonosan } from 'vonosan/vite'
import vonoConfig from './vonosan.config.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.PORT ?? '4000')

  return {
    plugins: [vue(), ...vonosan(vonoConfig)],
    server: {
      host: '0.0.0.0',
      port,
    },
    preview: {
      host: '0.0.0.0',
      port,
    },
  }
})
`,
        }
      : {}),

    'drizzle.config.ts': `${h}

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: '${drizzleDialect}',
${drizzleCredentialsBlock}
})
`,

    '.env': `# ──────────────────────────────────────────────────────────────────
# ${projectName} — Environment Variables
# ──────────────────────────────────────────────────────────────────

NODE_ENV=development
PORT=4000
APP_URL=http://localhost:4000
APP_KEY=change-me-to-a-random-secret

${dbEnvBlock}JWT_SECRET=change-me-to-a-random-jwt-secret
CLIENT_URL=http://localhost:4000
ALLOWED_ORIGINS=http://localhost:4000
${queue !== 'none' ? `QUEUE_DRIVER=${queue}
` : ''}${queue === 'bullmq' ? `QUEUE_REDIS_DRIVER=${queueRedisDriver}
REDIS_URL=redis://localhost:6379
` : ''}${queue === 'cloudflare-queues' ? `CF_QUEUE_NAME=default
` : ''}${queue === 'bullmq' && queueRedisDriver === 'upstash-redis' ? `UPSTASH_REDIS_URL=rediss://default:your-password@your-upstash-host:6379
` : ''}${cache === 'ioredis' ? `CACHE_DRIVER=ioredis
CACHE_REDIS_URL=redis://localhost:6379
` : ''}${cache === 'upstash' ? `CACHE_DRIVER=upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
` : ''}${cache === 'kv' ? `CACHE_DRIVER=kv
CLOUDFLARE_KV_NAMESPACE_ID=
` : ''}${websocket ? `WEBSOCKET_DRIVER=${websocketDriver}
` : ''}
`,

    '.env.example': `# ──────────────────────────────────────────────────────────────────
# ${projectName} — Environment Variables Example
# Copy this file to .env and fill in the values.
# ──────────────────────────────────────────────────────────────────

NODE_ENV=
PORT=
APP_URL=
APP_KEY=

DATABASE_URL=
DATABASE_AUTH_TOKEN=
D1_ACCOUNT_ID=
D1_DATABASE_ID=
D1_TOKEN=
JWT_SECRET=
CLIENT_URL=
ALLOWED_ORIGINS=
QUEUE_DRIVER=
QUEUE_REDIS_DRIVER=
CF_QUEUE_NAME=
REDIS_URL=
UPSTASH_REDIS_URL=
CACHE_DRIVER=
CACHE_REDIS_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CLOUDFLARE_KV_NAMESPACE_ID=
WEBSOCKET_DRIVER=
`,

    'llms.txt': `# ${projectName}

  > A Vonosan ${isApiOnly ? 'API-only' : 'full-stack'} TypeScript application.

## Stack
- Runtime: ${deploymentTarget}
- Database: ${database}
- Auth: ${auth ? 'JWT + refresh tokens' : 'none'}
- Queue: ${queue}${queue === 'bullmq' ? ` (${queueRedisDriver})` : ''}
- Cache: ${cache}
- WebSocket: ${websocket ? websocketDriver : 'none'}
- Email: ${answers.email}
- Storage: ${answers.storage}

## Structure
- \`src/modules/\` — feature modules (routes, controller, service, schema)
- \`src/db/\` — Drizzle ORM schema and migrations
- \`src/shared/\` — shared utilities, gates, policies
- \`src/emails/\` — email templates
- \`src/jobs/\` — cron jobs

## Commands
- \`bun run dev\` — start the development server
- \`bun run lint\` — run Vonosan linter
- \`bun run migrate:make\` — create migration
- \`bun run migrate:run\` — run migrations
- \`bun run make:module -- users\` — scaffold a module
`,

    ...(!isApiOnly
      ? {
          'index.html': `<!DOCTYPE html>
<html lang="en" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body class="h-full">
    <div id="app" class="isolate"><!--ssr-outlet--></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,

          'src/App.vue': `<!--
  ${projectName} — Root App Component
-->
<template>
  <RouterView />
</template>
`,

          'src/main.ts': `${h}

import { createApp as createVueApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import { createRouter } from './router.js'

export function createApp() {
  const app = createVueApp(App)
  const pinia = createPinia()
  const head = createHead()
  const router = createRouter()

  app.use(pinia)
  app.use(head)
  app.use(router)

  return { app, pinia, head, router }
}

if (!import.meta.env.SSR) {
  const { app, router } = createApp()
  router.isReady().then(() => {
    app.mount('#app')
  })
}
`,
        }
      : {}),

    'index.ts': rootServerEntry,

    'src/app.ts': `${h}

import { createVonosanApp, registerDbFactory } from 'vonosan/server'
import type { Hono } from 'hono'
import config from '../vonosan.config.js'
import { createDb } from './db/index.js'
import healthRouter from './modules/health/health.routes.js'
${auth ? "import authRouter from './modules/auth/auth.routes.js'" : ''}
${needsNativeWs ? "import { registerNativeWebSocketRoutes } from './shared/ws/native.server.js'" : ''}
${websocketDriver === 'cloudflare-websocket' ? "import { registerCloudflareWebSocketRoutes } from './shared/ws/cloudflare.server.js'" : ''}
${apiDocs ? "import openApiSpec from './openapi.js'" : ''}

${isApiOnly
  ? `const modules: Record<string, { default?: Hono }> = {
  './modules/health/health.routes.ts': { default: healthRouter },
  ${auth ? "'./modules/auth/auth.routes.ts': { default: authRouter }," : ''}
}`
  : "const modules = import.meta.glob('./modules/*/*.routes.ts', { eager: true }) as Record<string, { default?: Hono }>"}

registerDbFactory({ createDb })

const app = createVonosanApp({
  config,
  ${apiDocs ? 'openApiSpec,' : ''}
  modules,
})

${needsNativeWs ? 'registerNativeWebSocketRoutes(app)' : ''}
${websocketDriver === 'cloudflare-websocket' ? 'registerCloudflareWebSocketRoutes(app)' : ''}

export default app
`,

    'src/server.ts': `${h}

import app from './app.js'

const port = Number(process.env.PORT ?? 4000)

export default {
  port,
  fetch: app.fetch,
}
`,

    ...(!isApiOnly
      ? {
        'src/router.ts': `${h}

import { createRouter as _createRouter, createWebHistory, createMemoryHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('./modules/home/index.page.vue'),
  },
  ${auth ? `{
    path: '/auth/login',
    component: () => import('./modules/auth/login.page.vue'),
  },
  {
    path: '/auth/register',
    component: () => import('./modules/auth/register.page.vue'),
  },
  {
    path: '/auth/forgot-password',
    component: () => import('./modules/auth/forgot-password.page.vue'),
  },
  {
    path: '/auth/reset-password',
    component: () => import('./modules/auth/reset-password.page.vue'),
  },` : ''}
]

export function createRouter() {
  return _createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes,
  })
}
`,

          'src/modules/home/index.page.vue': `<template>
  <div class="landing">
    <header class="topbar">
      <p class="brand">${projectName}</p>
      <nav class="menu">
        <a href="#features">Features</a>
        <a href="#why">Why Vonosan</a>
        <a href="#start">Get Started</a>
      </nav>
    </header>

    <section class="hero" id="start">
      <p class="eyebrow">Welcome to Vonosan</p>
      <h1>Build fast apps for every age and every audience.</h1>
      <p class="subtext">
        ${projectName} ships with sensible full-stack defaults, beautiful UI foundations,
        and a module-first architecture that scales cleanly.
      </p>
      <div class="actions">
        <a class="btn btn-primary" href="/auth/register">Create Account</a>
        <a class="btn btn-ghost" href="#features">Explore Features</a>
      </div>
    </section>

    <section class="features" id="features">
      <article class="card">
        <h2>Fast by Default</h2>
        <p>
          Vite, Vue, and a typed backend workflow give you rapid local iteration and confident releases.
        </p>
      </article>
      <article class="card">
        <h2>Secure Foundations</h2>
        <p>
          Auth-ready route patterns, environment helpers, and clear module boundaries reduce mistakes.
        </p>
      </article>
      <article class="card">
        <h2>Readable Structure</h2>
        <p>
          Modules keep routes, services, and UI close together so teams of all experience levels can move quickly.
        </p>
      </article>
    </section>

    <section class="why" id="why">
      <h2>Designed for everyone</h2>
      <p>
        This starter keeps language clear, spacing comfortable, and interactions simple so children,
        adults, and seniors can navigate with confidence.
      </p>
    </section>

    <footer class="footer">
      <p>Made with Vonosan</p>
      <small>Start building from src/modules and make it yours.</small>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  --bg-a: #f8fafc;
  --bg-b: #eef6ff;
  --text: #10243e;
  --muted: #4a5f7a;
  --card: #ffffff;
  --accent: #0b6df6;
  --accent-strong: #084fb2;
  min-height: 100vh;
  padding: 1.25rem;
  color: var(--text);
  font-family: "Space Grotesk", "Nunito", "Segoe UI", sans-serif;
  background:
    radial-gradient(1200px 420px at 90% -10%, rgba(11, 109, 246, 0.18), transparent 60%),
    radial-gradient(800px 380px at 8% 12%, rgba(255, 140, 66, 0.16), transparent 60%),
    linear-gradient(180deg, var(--bg-a), var(--bg-b));
}

.topbar {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.menu {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.menu a {
  color: var(--muted);
  text-decoration: none;
  font-weight: 600;
}

.menu a:hover {
  color: var(--text);
}

.hero {
  max-width: 1080px;
  margin: 3.5rem auto 2rem;
}

.eyebrow {
  margin: 0;
  color: var(--accent-strong);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.78rem;
}

.hero h1 {
  margin: 0.6rem 0 0;
  max-width: 16ch;
  font-size: clamp(1.9rem, 4vw, 3.2rem);
  line-height: 1.1;
}

.subtext {
  margin-top: 0.9rem;
  max-width: 62ch;
  color: var(--muted);
  line-height: 1.65;
}

.actions {
  margin-top: 1.25rem;
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  text-decoration: none;
  border-radius: 999px;
  padding: 0.68rem 1.05rem;
  font-weight: 700;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}

.btn-primary:hover {
  background: var(--accent-strong);
}

.btn-ghost {
  background: rgba(16, 36, 62, 0.08);
  color: var(--text);
}

.features {
  max-width: 1080px;
  margin: 1rem auto 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.card {
  background: var(--card);
  border: 1px solid rgba(16, 36, 62, 0.08);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 10px 24px rgba(16, 36, 62, 0.07);
}

.card h2 {
  margin: 0;
  font-size: 1.07rem;
}

.card p {
  margin: 0.55rem 0 0;
  color: var(--muted);
  line-height: 1.55;
}

.why {
  max-width: 1080px;
  margin: 1.15rem auto 0;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(16, 36, 62, 0.08);
  border-radius: 16px;
  padding: 1rem;
}

.why h2 {
  margin: 0;
  font-size: 1.18rem;
}

.why p {
  margin: 0.55rem 0 0;
  color: var(--muted);
  line-height: 1.65;
}

.footer {
  max-width: 1080px;
  margin: 1.25rem auto 0;
  padding: 1rem 0 1.5rem;
  color: var(--muted);
}

.footer p {
  margin: 0;
  font-weight: 700;
  color: var(--text);
}

.footer small {
  display: block;
  margin-top: 0.25rem;
}

@media (max-width: 900px) {
  .features {
    grid-template-columns: 1fr;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
`,

          'src/route-rules.ts': `${h}

import type { RouteRules } from 'vonosan/server/route-rules'

/**
 * Route rules — control SSR/SPA rendering per path.
 * Matched top-to-bottom; first match wins.
 */
export const routeRules: RouteRules = {
  '/': { mode: 'ssr', cache: 3600 },
  '/dashboard/**': { mode: 'spa' },
  '/admin/**': { mode: 'spa' },
}
`,
        }
      : {}),

    ...(auth
      ? {
          'src/modules/auth/auth.routes.ts': `${h}

import { authRouter } from '@vonosan/auth'

export default authRouter
`,
        }
      : {}),

    ...(auth && !isApiOnly
      ? {
          'src/modules/auth/login.page.vue': `<template>
  <main style="max-width: 480px; margin: 3rem auto; padding: 1rem;">
    <h1>Login</h1>
    <form @submit.prevent="onSubmit" style="display: grid; gap: 0.75rem; margin-top: 1rem;">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" :disabled="loading">{{ loading ? 'Signing in...' : 'Login' }}</button>
    </form>
    <p v-if="message" style="color: green; margin-top: 0.75rem;">{{ message }}</p>
    <p v-if="error" style="color: #c00; margin-top: 0.75rem;">{{ error }}</p>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    if (!res.ok) throw new Error('Invalid credentials')
    message.value = 'Login successful.'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
`,
          'src/modules/auth/register.page.vue': `<template>
  <main style="max-width: 480px; margin: 3rem auto; padding: 1rem;">
    <h1>Create account</h1>
    <form @submit.prevent="onSubmit" style="display: grid; gap: 0.75rem; margin-top: 1rem;">
      <input v-model="username" type="text" placeholder="Username" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" :disabled="loading">{{ loading ? 'Creating...' : 'Register' }}</button>
    </form>
    <p v-if="message" style="color: green; margin-top: 0.75rem;">{{ message }}</p>
    <p v-if="error" style="color: #c00; margin-top: 0.75rem;">{{ error }}</p>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value,
      }),
    })
    if (!res.ok) throw new Error('Registration failed')
    message.value = 'Account created.'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>
`,
          'src/modules/auth/forgot-password.page.vue': `<template>
  <main style="max-width: 480px; margin: 3rem auto; padding: 1rem;">
    <h1>Forgot password</h1>
    <form @submit.prevent="onSubmit" style="display: grid; gap: 0.75rem; margin-top: 1rem;">
      <input v-model="email" type="email" placeholder="Email" required />
      <button type="submit" :disabled="loading">{{ loading ? 'Sending...' : 'Send reset code' }}</button>
    </form>
    <p v-if="message" style="color: green; margin-top: 0.75rem;">{{ message }}</p>
    <p v-if="error" style="color: #c00; margin-top: 0.75rem;">{{ error }}</p>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await fetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })
    if (!res.ok) throw new Error('Request failed')
    message.value = 'If the email exists, a reset code has been sent.'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
  } finally {
    loading.value = false
  }
}
</script>
`,
          'src/modules/auth/reset-password.page.vue': `<template>
  <main style="max-width: 480px; margin: 3rem auto; padding: 1rem;">
    <h1>Reset password</h1>
    <form @submit.prevent="onSubmit" style="display: grid; gap: 0.75rem; margin-top: 1rem;">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="otp" type="text" placeholder="OTP code" maxlength="6" required />
      <input v-model="password" type="password" placeholder="New password" required />
      <button type="submit" :disabled="loading">{{ loading ? 'Resetting...' : 'Reset password' }}</button>
    </form>
    <p v-if="message" style="color: green; margin-top: 0.75rem;">{{ message }}</p>
    <p v-if="error" style="color: #c00; margin-top: 0.75rem;">{{ error }}</p>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const otp = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        otp: otp.value,
        password: password.value,
      }),
    })
    if (!res.ok) throw new Error('Reset failed')
    message.value = 'Password reset successful.'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Reset failed'
  } finally {
    loading.value = false
  }
}
</script>
`,
        }
      : {}),

    'src/modules/health/health.routes.ts': `${h}

import { Hono } from 'hono'

const healthRouter = new Hono()

healthRouter.get('/', (c) => {
  return c.json({
    ok: true,
    service: '${projectName}',
    timestamp: new Date().toISOString(),
  })
})

export default healthRouter
`,

    ...(!isApiOnly
      ? {
          'src/env.d.ts': `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, unknown>
  export default component
}
`,
        }
      : {}),

    'src/index.ts': `${h}

export { default } from './server.js'
`,

    ...(apiDocs
      ? {
          'src/openapi.ts': `${h}

import { generateOpenApiSpec } from 'vonosan/server'

export default generateOpenApiSpec(
  '${projectName}',
  '1.0.0',
  process.env.APP_URL ?? 'http://localhost:4000',
)
`,
        }
      : {}),

    'src/db/index.ts': dbBootstrap,

    ...(queue === 'bullmq'
      ? {
          'src/jobs/queue.provider.ts': `${h}

/**
 * Queue provider scaffold.
 * Driver: bullmq
 * Redis backend: ${queueRedisDriver}
 */
export const queueDriver = 'bullmq' as const
export const queueRedisBackend = '${queueRedisDriver}' as const

export const queueConnection = {
  redisUrl:
    process.env.REDIS_URL ??
    process.env.UPSTASH_REDIS_URL ??
    'redis://localhost:6379',
}
`,
        }
      : {}),

    ...(queue === 'cloudflare-queues'
      ? {
          'src/jobs/queue.provider.ts': `${h}

/**
 * Queue provider scaffold.
 * Driver: cloudflare-queues
 */
export const queueDriver = 'cloudflare-queues' as const
export const cloudflareQueueName = process.env.CF_QUEUE_NAME ?? 'default'
`,
        }
      : {}),

    'scripts/vono-cli.mjs': `#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const args = process.argv.slice(2)

if (!args.length) {
  console.error('[vono-cli] Missing command, e.g. migrate:run or lint')
  process.exit(1)
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (typeof result.status === 'number') return result.status
  return result.error ? 1 : 0
}

const localBin = process.platform === 'win32'
  ? join(process.cwd(), 'node_modules', '.bin', 'vonosan.cmd')
  : join(process.cwd(), 'node_modules', '.bin', 'vonosan')

if (existsSync(localBin)) {
  process.exit(run(localBin, args))
}

let status = run('bunx', ['--yes', '@vonosan/cli', ...args])
if (status === 0) {
  process.exit(0)
}

status = run('npx', ['--yes', '@vonosan/cli', ...args])
if (status === 0) {
  process.exit(0)
}

console.error(
  '[vono-cli] Could not run @vonosan/cli. Please install it or try again later when npm release is available.',
)
process.exit(1)
`,

    ...(websocket
      ? {
          'src/shared/ws/provider.ts': `${h}

/**
 * WebSocket provider scaffold.
 * Selected driver: ${websocketDriver}
 */
export const websocketDriver = '${websocketDriver}' as const
`,
        }
      : {}),

    ...(websocketDriver === 'socket.io'
      ? {
          'src/shared/ws/socketio.server.ts': isBunRuntimeTarget
            ? `${h}

import { Server as Engine } from '@socket.io/bun-engine'
import { Server as SocketIOServer } from 'socket.io'
import type { Hono } from 'hono'

export function createBunSocketIOServer(app: Hono) {
  const io = new SocketIOServer()
  const engine = new Engine({ path: '/socket.io/' })

  io.bind(engine)

  io.on('connection', (socket) => {
    socket.emit('connected', { ok: true })
  })

  const { websocket } = engine.handler()

  return {
    io,
    websocket,
    idleTimeout: 30,
    fetch(req: Request, server: unknown) {
      const url = new URL(req.url)

      if (url.pathname.startsWith('/socket.io/')) {
        return engine.handleRequest(req, server as never)
      }

      return app.fetch(req, server as never)
    },
  }
}
`
            : `${h}

import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'node:http'

export function attachSocketIOServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io/',
    cors: {
      origin: process.env.CLIENT_URL ?? process.env.APP_URL ?? 'http://localhost:4000',
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    socket.emit('connected', { ok: true })
  })

  return io
}
`,
        }
      : {}),

    ...(websocketDriver === 'native'
      ? {
          'src/shared/ws/native.server.ts': isNodeRuntimeTarget
            ? `${h}

import { createNodeWebSocket } from '@hono/node-ws'
import type { Hono } from 'hono'
import type { Server as HTTPServer } from 'node:http'

let injectNodeWebSocket: ((server: HTTPServer) => void) | null = null

export function registerNativeWebSocketRoutes(app: Hono) {
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })
  injectNodeWebSocket = injectWebSocket as (server: HTTPServer) => void

  app.get(
    '/ws',
    upgradeWebSocket(() => ({
      onMessage(event, ws) {
        ws.send(String(event.data))
      },
    })),
  )
}

export function attachNodeWebSocketServer(server: HTTPServer) {
  injectNodeWebSocket?.(server)
}
`
            : isBunRuntimeTarget
              ? `${h}

import { upgradeWebSocket, websocket } from 'hono/bun'
import type { Hono } from 'hono'

export { websocket }

export function registerNativeWebSocketRoutes(app: Hono) {
  app.get(
    '/ws',
    upgradeWebSocket(() => ({
      onMessage(event, ws) {
        ws.send(String(event.data))
      },
    })),
  )
}
`
              : isCloudflareRuntimeTarget
                ? `${h}

import { upgradeWebSocket } from 'hono/cloudflare-workers'
import type { Hono } from 'hono'

export function registerNativeWebSocketRoutes(app: Hono) {
  app.get(
    '/ws',
    upgradeWebSocket(() => ({
      onMessage(event, ws) {
        ws.send(String(event.data))
      },
    })),
  )
}
`
                : isDenoRuntimeTarget
                  ? `${h}

import { upgradeWebSocket } from 'hono/deno'
import type { Hono } from 'hono'

export function registerNativeWebSocketRoutes(app: Hono) {
  app.get(
    '/ws',
    upgradeWebSocket(() => ({
      onMessage(event, ws) {
        ws.send(String(event.data))
      },
    })),
  )
}
`
                  : `${h}

/**
 * Native WebSocket scaffold placeholder.
 * For target "${deploymentTarget}", check Hono adapter docs for websocket helper support.
 */
export function registerNativeWebSocketRoutes() {}
`,
        }
      : {}),

    ...(websocketDriver === 'cloudflare-websocket'
      ? {
          'src/shared/ws/cloudflare.server.ts': `${h}

import { upgradeWebSocket } from 'hono/cloudflare-workers'
import type { Hono } from 'hono'

export function registerCloudflareWebSocketRoutes(app: Hono) {
  app.get(
    '/ws',
    upgradeWebSocket(() => ({
      onMessage(event, ws) {
        ws.send(String(event.data))
      },
    })),
  )
}
`,
        }
      : {}),

    ...(isDockerTarget
      ? {
          '.dockerignore': `node_modules
dist
.git
.github
*.log
.env
`,
          Dockerfile:
            dockerRuntime === 'bun'
              ? `FROM oven/bun:1

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile || bun install
RUN bun run build

EXPOSE 4000

CMD ["bun", "run", "start"]
`
              : `FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
`,
          'docker-compose.yml': `services:
  app:
    build: .
    container_name: ${projectName}
    ports:
      - "4000:4000"
    env_file:
      - .env
    restart: unless-stopped
`,
          'docker-stack.yml': `version: "3.9"

services:
  app:
    image: ${projectName}:latest
    ports:
      - target: 4000
        published: 4000
        protocol: tcp
        mode: ingress
    env_file:
      - .env
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
`,
        }
      : {}),

    'src/db/schema.ts': `${h}

// Auto-generated by vonosan schema:sync
// Add your schema imports here

export {}
`,

    'src/db/relations.ts': `${h}

// Cross-module Drizzle relations
// Import and re-export relations from each module schema here

export {}
`,

    'package.json': JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        type: 'module',
        scripts: {
          ...(isApiOnly
            ? {
                dev: apiDevCommand,
                build: 'tsc -p tsconfig.json',
              }
            : {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview',
              }),
          start: startCommand,
          'vono:cli': 'node ./scripts/vono-cli.mjs',
          'migrate:run': 'node ./scripts/vono-cli.mjs migrate:run',
          'migrate:make': 'node ./scripts/vono-cli.mjs migrate:make',
          lint: 'node ./scripts/vono-cli.mjs lint',
          'make:module': 'node ./scripts/vono-cli.mjs make:module',
          ...(testing !== 'none' ? { test: testing === 'bun' ? 'bun test' : testing } : {}),
        },
        dependencies: {
          vonosan: 'latest',
          hono: 'latest',
          '@hono/node-server': 'latest',
          ...(auth ? { '@vonosan/auth': 'latest', '@hono/zod-validator': 'latest' } : {}),
          ...(!isApiOnly
            ? {
                vue: 'latest',
                'vue-router': 'latest',
                pinia: 'latest',
                '@unhead/vue': 'latest',
                '@unhead/ssr': 'latest',
                '@nuxt/ui': 'latest',
              }
            : {}),
          'drizzle-orm': 'latest',
          ...(usesPostgresJs ? { postgres: 'latest' } : {}),
          ...(usesCockroach ? { pg: 'latest' } : {}),
          ...((usesMysql || usesSingleStore) ? { mysql2: 'latest' } : {}),
          ...(usesLibsql ? { '@libsql/client': 'latest' } : {}),
          ...(usesMssql ? { mssql: 'latest' } : {}),
          ...(queue === 'bullmq' ? { bullmq: 'latest' } : {}),
          ...(needsIoredis ? { ioredis: 'latest' } : {}),
          ...(needsRedisClient ? { redis: 'latest' } : {}),
          ...(needsUpstashRedis ? { '@upstash/redis': 'latest' } : {}),
          ...(needsSocketIo
            ? {
                'socket.io': 'latest',
                ...(!isApiOnly ? { 'socket.io-client': 'latest' } : {}),
              }
            : {}),
          ...(needsSocketIoBunEngine ? { '@socket.io/bun-engine': 'latest' } : {}),
          ...(needsNodeWebSocketAdapter ? { '@hono/node-ws': 'latest' } : {}),
          zod: 'latest',
        },
        devDependencies: {
          typescript: 'latest',
          ...(!isApiOnly
            ? {
                vite: 'latest',
                '@vitejs/plugin-vue': 'latest',
              }
            : {}),
          ...(isApiOnly && apiDevCommand === 'tsx watch index.ts' ? { tsx: 'latest' } : {}),
          'drizzle-kit': 'latest',
          ...(usesCockroach ? { '@types/pg': 'latest' } : {}),
          '@types/bun': 'latest',
        },
      },
      null,
      2,
    ),

    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ESNext',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          skipLibCheck: true,
          jsx: 'preserve',
          lib: ['ESNext', 'DOM'],
          paths: {
            '@@ws-adapter': ['./node_modules/@vonosan/ws/adapters/bun.js'],
          },
        },
        include: ['src/**/*', 'index.ts', '*.d.ts', 'vonosan.config.ts'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2,
    ),
  }
}
