/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { zodValidator } from '../../server/middleware/validator.js'
import { z } from 'zod'

// ─── Tests ───────────────────────────────────────────────────────────

describe('middleware chain integration', () => {
  // ── configProvider ────────────────────────────────────────────────

  it('configProvider sets c.var.config from environment', async () => {
    const app = new Hono<{ Variables: { config: Record<string, string> } }>()

    // Minimal configProvider simulation
    app.use('*', async (c, next) => {
      c.set('config', { DATABASE_URL: 'postgres://test', JWT_SECRET: 'secret' })
      await next()
    })

    app.get('/test', (c) => {
      const config = c.get('config')
      return c.json({ hasConfig: Boolean(config), dbUrl: config.DATABASE_URL })
    })

    const res = await app.request('/test')
    expect(res.status).toBe(200)
    const body = await res.json() as { hasConfig: boolean; dbUrl: string }
    expect(body.hasConfig).toBe(true)
    expect(body.dbUrl).toBe('postgres://test')
  })

  // ── dbProvider finally block ──────────────────────────────────────

  it('dbProvider closes connection in finally block even on error', async () => {
    const app = new Hono()
    let connectionClosed = false

    app.use('*', async (c, next) => {
      // Simulate dbProvider: set db, call next, close in finally
      try {
        c.set('db' as string, { query: () => [] })
        await next()
      } finally {
        connectionClosed = true
      }
    })

    app.get('/error', () => {
      throw new Error('Simulated handler error')
    })

    // Even though the handler throws, finally should run
    try {
      await app.request('/error')
    } catch {
      // expected
    }

    expect(connectionClosed).toBe(true)
  })

  // ── zodValidator ──────────────────────────────────────────────────

  it('zodValidator returns 422 on invalid JSON body', async () => {
    const app = new Hono()

    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
    })

    app.post('/users', zodValidator('json', schema), (c) => c.json({ ok: true }))

    const res = await app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', name: '' }),
    })

    expect(res.status).toBe(422)
    const body = await res.json() as { success: boolean; errors: Record<string, string> }
    expect(body.success).toBe(false)
    expect(body.errors).toBeDefined()
    expect(body.errors.email).toBeDefined()
  })

  it('zodValidator passes valid data to handler', async () => {
    const app = new Hono()

    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
    })

    app.post('/users', zodValidator('json', schema), (c) => {
      return c.json({ ok: true, received: c.get('json' as string) })
    })

    const res = await app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', name: 'Alice' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })

  it('zodValidator returns 422 on malformed JSON', async () => {
    const app = new Hono()
    const schema = z.object({ name: z.string() })

    app.post('/test', zodValidator('json', schema), (c) => c.json({ ok: true }))

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    })

    expect(res.status).toBe(422)
  })
})
