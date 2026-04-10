/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { generateHeader } from '../header-generator.js'

// ─── Naming helpers ───────────────────────────────────────────────────────────

/** "user-profile" → "UserProfile" */
export function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

/** "user-profile" → "userProfile" */
export function toCamelCase(name: string): string {
  const pascal = toPascalCase(name)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

/** "UserProfile" → "user_profiles" (simple pluralisation) */
export function toTableName(name: string): string {
  return name
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '') + 's'
}

// ─── Individual file generators ───────────────────────────────────────────────

export function generateService(name: string): string {
  const pascal = toPascalCase(name)
  const camel = toCamelCase(name)
  const header = generateHeader(`src/modules/${name}/${name}.service.ts`)
  return `${header}

import type { AppVariables } from 'vonosan/types'
import type { Context } from 'hono'

export class ${pascal}Service {
  constructor(private readonly c: Context<{ Variables: AppVariables }>) {}

  async findAll() {
    // TODO: implement findAll
    return []
  }

  async findById(id: string) {
    // TODO: implement findById
    return null
  }

  async create(data: unknown) {
    // TODO: implement create
    return data
  }

  async update(id: string, data: unknown) {
    // TODO: implement update
    return { id, ...data as object }
  }

  async delete(id: string) {
    // TODO: implement delete
    return { id }
  }
}

export const ${camel}Service = (c: Context<{ Variables: AppVariables }>) =>
  new ${pascal}Service(c)
`
}

export function generateController(name: string): string {
  const pascal = toPascalCase(name)
  const camel = toCamelCase(name)
  const header = generateHeader(`src/modules/${name}/${name}.controller.ts`)
  return `${header}

import type { Context } from 'hono'
import type { AppVariables } from 'vonosan/types'
import { success, error } from 'vonosan/server'
import { ${camel}Service } from './${name}.service.js'

export const ${pascal}Controller = {
  async index(c: Context<{ Variables: AppVariables }>) {
    const items = await ${camel}Service(c).findAll()
    return c.json(success('${pascal} list', items))
  },

  async show(c: Context<{ Variables: AppVariables }>) {
    const { id } = c.req.param()
    const item = await ${camel}Service(c).findById(id)
    if (!item) return c.json(error('${pascal} not found'), 404)
    return c.json(success('${pascal} retrieved', item))
  },

  async store(c: Context<{ Variables: AppVariables }>) {
    const body = await c.req.json()
    const item = await ${camel}Service(c).create(body)
    return c.json(success('${pascal} created', item), 201)
  },

  async update(c: Context<{ Variables: AppVariables }>) {
    const { id } = c.req.param()
    const body = await c.req.json()
    const item = await ${camel}Service(c).update(id, body)
    return c.json(success('${pascal} updated', item))
  },

  async destroy(c: Context<{ Variables: AppVariables }>) {
    const { id } = c.req.param()
    await ${camel}Service(c).delete(id)
    return c.json(success('${pascal} deleted'))
  },
}
`
}

export function generateDto(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/${name}.dto.ts`)
  return `${header}

import { z } from 'zod'

export const Create${pascal}Schema = z.object({
  // TODO: define create fields
})

export const Update${pascal}Schema = Create${pascal}Schema.partial()

export type Create${pascal}Dto = z.infer<typeof Create${pascal}Schema>
export type Update${pascal}Dto = z.infer<typeof Update${pascal}Schema>
`
}

export function generateRoutes(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/${name}.routes.ts`)
  return `${header}

import { Hono } from 'hono'
import type { AppVariables } from 'vonosan/types'
import { ${pascal}Controller } from './${name}.controller.js'

const router = new Hono<{ Variables: AppVariables }>()

router.get('/api/v1/${name}', ${pascal}Controller.index)
router.get('/api/v1/${name}/:id', ${pascal}Controller.show)
router.post('/api/v1/${name}', ${pascal}Controller.store)
router.put('/api/v1/${name}/:id', ${pascal}Controller.update)
router.delete('/api/v1/${name}/:id', ${pascal}Controller.destroy)

export default router
`
}

export function generateSchema(name: string, saas = false): string {
  const tableName = toTableName(toPascalCase(name))
  const header = generateHeader(`src/modules/${name}/${name}.schema.ts`)
  const softDeleteCol = saas ? `\n  deleted_at: timestamp('deleted_at'),` : ''
  return `${header}

import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const ${tableName} = pgTable('${tableName}', {
  id: uuid('id').primaryKey().defaultRandom(),
  // TODO: add columns
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),${softDeleteCol}
})

export type ${toPascalCase(name)} = typeof ${tableName}.$inferSelect
export type New${toPascalCase(name)} = typeof ${tableName}.$inferInsert
`
}

export function generateResource(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/${name}.resource.ts`)
  return `${header}

import { buildPaginationMeta } from 'vonosan/server'

export class ${pascal}Resource {
  static toResource(item: Record<string, unknown>, fields?: string[]) {
    if (fields && fields.length > 0) {
      return Object.fromEntries(
        Object.entries(item).filter(([k]) => fields.includes(k)),
      )
    }
    return item
  }

  static toCollection(
    items: Record<string, unknown>[],
    total: number,
    page: number,
    limit: number,
  ) {
    return {
      ${name}s: items.map(i => ${pascal}Resource.toResource(i)),
      meta: buildPaginationMeta(page, limit, total),
    }
  }
}
`
}

export function generatePolicy(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/${name}.policy.ts`)
  return `${header}

import type { AuthAccount } from 'vonosan/types'

export class ${pascal}Policy {
  static view(_user: AuthAccount, _resource?: unknown): boolean {
    return true
  }

  static create(_user: AuthAccount): boolean {
    return true
  }

  static update(user: AuthAccount, resource?: Record<string, unknown>): boolean {
    // Example: only the owner or admin can update
    if (user.currentRole === 'admin' || user.currentRole === 'superadmin') return true
    return resource?.ownerId === user.id
  }

  static delete(user: AuthAccount, resource?: Record<string, unknown>): boolean {
    if (user.currentRole === 'admin' || user.currentRole === 'superadmin') return true
    return resource?.ownerId === user.id
  }
}
`
}

export function generateScopes(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/${name}.scopes.ts`)
  return `${header}

/**
 * ${pascal} permission scopes.
 * Register these in your auth module's scope registry.
 */
export const ${name.toUpperCase().replace(/-/g, '_')}_SCOPES = [
  '${name}:read',
  '${name}:write',
  '${name}:delete',
  '${name}:admin',
] as const

export type ${pascal}Scope = (typeof ${name.toUpperCase().replace(/-/g, '_')}_SCOPES)[number]
`
}

export function generateMiddleware(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/${name}.middleware.ts`)
  return `${header}

import type { Context, Next } from 'hono'
import type { AppVariables } from 'vonosan/types'
import { Logger } from 'vonosan/server'

/**
 * ${pascal} middleware — add your logic here.
 */
export async function ${toCamelCase(name)}Middleware(
  c: Context<{ Variables: AppVariables }>,
  next: Next,
): Promise<void> {
  Logger.debug('${pascal} middleware', { path: c.req.path })
  await next()
}
`
}

export function generatePage(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/index.page.vue`)
  return `<!--
${header.replace(/^\/\*\*/, '').replace(/\s*\*\/$/, '').replace(/^\s*\* ?/gm, '').trim()}
-->
<script setup lang="ts">
import { use${pascal} } from './composables/use${pascal}.js'

const { items, loading, fetchAll } = use${pascal}()

onMounted(() => fetchAll())
</script>

<template>
  <div>
    <h1>${pascal}</h1>
    <div v-if="loading">Loading…</div>
    <ul v-else>
      <li v-for="item in items" :key="(item as any).id">{{ item }}</li>
    </ul>
  </div>
</template>
`
}

export function generateComposable(name: string): string {
  const pascal = toPascalCase(name)
  const camel = toCamelCase(name)
  const header = generateHeader(`src/modules/${name}/composables/use${pascal}.ts`)
  return `${header}

import { ref } from 'vue'
import { useVonosanFetch } from 'vonosan/client'

export function use${pascal}() {
  const items = ref<unknown[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await useVonosanFetch('/api/v1/${name}')
      items.value = (data as any)?.data ?? []
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(payload: unknown) {
    const { data } = await useVonosanFetch('/api/v1/${name}', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return (data as any)?.data
  }

  return { items, loading, error, fetchAll, create }
}
`
}

export function generateStore(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/stores/${name}.store.ts`)
  return `${header}

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const use${pascal}Store = defineStore('${name}', () => {
  const items = ref<unknown[]>([])
  const current = ref<unknown | null>(null)

  function setItems(data: unknown[]) {
    items.value = data
  }

  function setCurrent(data: unknown | null) {
    current.value = data
  }

  return { items, current, setItems, setCurrent }
})
`
}

export function generateMigration(name: string): string {
  const header = generateHeader(`src/db/migrations/${name}.sql`)
  return `-- ${header.replace(/\/\*\*|\*\/|\* ?/g, '').trim()}

-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- TODO: write your migration SQL here
-- Example:
-- CREATE TABLE IF NOT EXISTS example (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
`
}

export function generateSeed(name: string): string {
  const header = generateHeader(`src/db/seeds/${name}.ts`)
  return `${header}

import { Logger } from 'vonosan/server'

/**
 * Seed: ${name}
 * Run with: vonosan db:seed ${name}
 */
export async function seed() {
  Logger.info('Running seed: ${name}')
  // TODO: insert seed data
  Logger.info('Seed complete: ${name}')
}

// Allow direct execution: bun run src/db/seeds/${name}.ts
seed().catch((err) => {
  Logger.error('Seed failed', { error: String(err) })
  process.exit(1)
})
`
}

export function generateTest(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/tests/${name}.unit.test.ts`)
  return `${header}

import { describe, it, expect } from 'bun:test'

describe('${pascal} unit tests', () => {
  it('should be defined', () => {
    expect(true).toBe(true)
  })

  // TODO: add unit tests for ${pascal}Service, ${pascal}Controller, etc.
})
`
}

export function generateIntegrationTest(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/tests/${name}.integration.test.ts`)
  return `${header}

import { describe, it, expect } from 'bun:test'

describe('${pascal} integration tests', () => {
  it('GET /api/v1/${name} returns 200', async () => {
    // TODO: set up test app and make real HTTP requests
    expect(true).toBe(true)
  })
})
`
}

export function generateE2ETest(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/tests/${name}.e2e.test.ts`)
  return `${header}

import { describe, it, expect } from 'bun:test'

describe('${pascal} e2e tests', () => {
  it('full CRUD flow', async () => {
    // TODO: implement end-to-end test
    expect(true).toBe(true)
  })
})
`
}

export function generateNotification(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/notifications/${name}.notification.ts`)
  return `${header}

import { defineEmail } from 'vonosan/server'

export const ${toCamelCase(name)}Notification = defineEmail({
  subject: '${pascal} Notification',
  html: (data: Record<string, unknown>) => \`
    <h1>${pascal}</h1>
    <p>\${JSON.stringify(data)}</p>
  \`,
  text: (data: Record<string, unknown>) => \`${pascal}: \${JSON.stringify(data)}\`,
})
`
}

export function generateJob(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/jobs/${name}.job.ts`)
  return `${header}

import { defineJob } from 'vonosan/server'
import { Logger } from 'vonosan/server'

export const ${toCamelCase(name)}Job = defineJob({
  name: '${name}',
  schedule: '0 * * * *', // every hour — adjust as needed
  description: '${pascal} scheduled job',
  async handler() {
    Logger.info('Running job: ${name}')
    // TODO: implement job logic
    Logger.info('Job complete: ${name}')
  },
})
`
}

export function generateEmail(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/emails/${name}.email.ts`)
  return `${header}

import { defineEmail } from 'vonosan/server'

export const ${toCamelCase(name)}Email = defineEmail({
  subject: '${pascal}',
  html: (data: Record<string, unknown>) => \`
    <!DOCTYPE html>
    <html>
      <body>
        <h1>${pascal}</h1>
        <p>Hello, \${data.name ?? 'there'}!</p>
        <!-- TODO: add email content -->
      </body>
    </html>
  \`,
  text: (data: Record<string, unknown>) => \`Hello, \${data.name ?? 'there'}!\`,
})
`
}

export function generateHelper(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/shared/utils/${name}.ts`)
  return `${header}

/**
 * ${pascal} helper utilities.
 * Extracted shared logic — used in 2+ places.
 */

/**
 * TODO: implement ${name} helper
 */
export function ${toCamelCase(name)}(input: unknown): unknown {
  return input
}
`
}

export function generateComponent(name: string): string {
  const pascal = toPascalCase(name)
  const header = generateHeader(`src/modules/${name}/components/${pascal}.vue`)
  return `<!--
${header.replace(/^\/\*\*/, '').replace(/\s*\*\/$/, '').replace(/^\s*\* ?/gm, '').trim()}
-->
<script setup lang="ts">
defineProps<{
  // TODO: define props
}>()
</script>

<template>
  <div class="${name}">
    <!-- TODO: implement ${pascal} component -->
    <slot />
  </div>
</template>
`
}
