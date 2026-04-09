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
  const { projectName, deploymentTarget, database, auth, apiDocs, saas, testing } = answers

  return {
    'vono.config.ts': `${h}

  import { defineVonoConfig } from 'vonosan'

export default defineVonoConfig({
  app: {
    name: '${projectName}',
    url: process.env.APP_URL ?? 'http://localhost:4000',
    env: process.env.NODE_ENV ?? 'development',
    key: process.env.APP_KEY ?? 'change-me',
    language: 'ts',
  },
  runtime: '${deploymentTarget}',
  mode: '${answers.projectType}',
  ${saas ? 'saas: true,' : ''}
  ${apiDocs ? `docs: {
    swagger: true,
    fiberplane: false,
    scalar: true,
    openapi: '/openapi.json',
  },` : ''}
  ${testing !== 'none' ? `test: { driver: '${testing}' },` : ''}
})
`,

    'vite.config.ts': `${h}

  import { defineConfig } from 'vite'
  import { vono } from 'vonosan/vite'
import vonoConfig from './vono.config.js'

export default defineConfig({
  plugins: [vono(vonoConfig)],
})
`,

    'drizzle.config.ts': `${h}

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: '${database === 'postgres' ? 'postgresql' : database === 'mysql' ? 'mysql' : 'sqlite'}',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
`,

    '.env': `# ──────────────────────────────────────────────────────────────────
# ${projectName} — Environment Variables
# ──────────────────────────────────────────────────────────────────

NODE_ENV=development
PORT=4000
APP_URL=http://localhost:4000
APP_KEY=change-me-to-a-random-secret

DATABASE_URL=postgresql://postgres:password@localhost:5432/${projectName.replace(/-/g, '_')}
JWT_SECRET=change-me-to-a-random-jwt-secret
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4000
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
JWT_SECRET=
CLIENT_URL=
ALLOWED_ORIGINS=
`,

    'llms.txt': `# ${projectName}

> A Vono full-stack TypeScript application.

## Stack
- Runtime: ${deploymentTarget}
- Database: ${database}
- Auth: ${auth ? 'JWT + refresh tokens' : 'none'}
- Queue: ${answers.queue}
- Cache: ${answers.cache}
- Email: ${answers.email}
- Storage: ${answers.storage}

## Structure
- \`src/modules/\` — feature modules (routes, controller, service, schema)
- \`src/db/\` — Drizzle ORM schema and migrations
- \`src/shared/\` — shared utilities, gates, policies
- \`src/emails/\` — email templates
- \`src/jobs/\` — cron jobs

## Commands
- \`vono make:module <name>\` — scaffold a new module
- \`vono migrate:run\` — run pending migrations
- \`vono lint\` — check code quality
`,

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
  <UApp>
    <RouterView />
  </UApp>
</template>
`,

    'src/main.ts': `${h}

import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue'
import { ui } from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import { createRouter } from './router.js'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  const head = createHead()
  const router = createRouter()

  app.use(pinia)
  app.use(head)
  app.use(ui)
  app.use(router)

  return { app, pinia, head, router }
}
`,

    'src/app.ts': `${h}

  import { createVonoApp } from 'vonosan/server'
import config from '../vono.config.js'
${apiDocs ? "import openApiSpec from './openapi.js'" : ''}

const app = createVonoApp({
  config,
  ${apiDocs ? 'openApiSpec,' : ''}
})

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

    'src/router.ts': `${h}

import { createRouter as _createRouter, createWebHistory, createMemoryHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('./modules/home/index.page.vue'),
  },
]

export function createRouter() {
  return _createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes,
  })
}
`,

    'src/route-rules.ts': `${h}

  import type { RouteRules } from 'vonosan/server'

/**
 * Route rules — control SSR/SPA rendering per path.
 * Matched top-to-bottom; first match wins.
 */
export const routeRules: RouteRules = {
  '/': { ssr: true },
  '/dashboard/**': { ssr: false },
  '/admin/**': { ssr: false },
}
`,

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

    'src/db/index.ts': `${h}

  import { createDb } from '@vonosan/drizzle'

export const { db, client } = createDb(process.env.DATABASE_URL!)
`,

    'src/db/schema.ts': `${h}

// Auto-generated by vono schema:sync
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
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
          start: 'bun dist/server/index.js',
          'migrate:run': 'vono migrate:run',
          'migrate:make': 'vono migrate:make',
          lint: 'vono lint',
          ...(testing !== 'none' ? { test: testing === 'bun' ? 'bun test' : testing } : {}),
        },
        dependencies: {
          vonosan: 'latest',
          '@vonosan/drizzle': 'latest',
          hono: 'latest',
          vue: 'latest',
          'vue-router': 'latest',
          pinia: 'latest',
          '@unhead/vue': 'latest',
          '@nuxt/ui': 'latest',
          'drizzle-orm': 'latest',
          zod: 'latest',
        },
        devDependencies: {
          '@vonosan/cli': 'latest',
          typescript: 'latest',
          vite: 'latest',
          'drizzle-kit': 'latest',
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
          jsx: 'preserve',
          lib: ['ESNext', 'DOM'],
          paths: {
            '@@ws-adapter': ['./node_modules/@vonosan/ws/adapters/bun.js'],
          },
        },
        include: ['src/**/*', 'vono.config.ts'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2,
    ),
  }
}
