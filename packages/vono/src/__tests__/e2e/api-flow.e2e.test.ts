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

// ─── Test app factory ─────────────────────────────────────────────────

function buildTestApp() {
  const app = new Hono()

  // Health endpoint
  app.get('/api/v1/health', (c) =>
    c.json({ status: 'ok', timestamp: new Date().toISOString() }),
  )

  // Validated endpoint
  const CreateSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  })

  app.post('/api/v1/users', zodValidator('json', CreateSchema), (c) =>
    c.json({ success: true, message: 'User created' }, 201),
  )

  // Rate limiter simulation
  const requestCounts = new Map<string, number>()
  const LIMIT = 3

  app.get('/api/v1/limited', (c) => {
    const ip = c.req.header('x-forwarded-for') ?? '127.0.0.1'
    const count = (requestCounts.get(ip) ?? 0) + 1
    requestCounts.set(ip, count)

    if (count > LIMIT) {
      return c.json(
        { success: false, message: 'Too many requests' },
        429,
      )
    }

    return c.json({ success: true, count })
  })

  return app
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('API flow e2e', () => {
  const app = buildTestApp()

  it('POST /api/v1/health returns { status: "ok" }', async () => {
    const res = await app.request('/api/v1/health')
    expect(res.status).toBe(200)

    const body = await res.json() as { status: string; timestamp: string }
    expect(body.status).toBe('ok')
    expect(typeof body.timestamp).toBe('string')
  })

  it('zodValidator returns 422 with errors object on invalid body', async () => {
    const res = await app.request('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'not-an-email' }),
    })

    expect(res.status).toBe(422)
    const body = await res.json() as { success: boolean; errors: Record<string, string> }
    expect(body.success).toBe(false)
    expect(body.errors).toBeDefined()
    expect(typeof body.errors).toBe('object')
  })

  it('zodValidator passes valid data and returns 201', async () => {
    const res = await app.request('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' }),
    })

    expect(res.status).toBe(201)
    const body = await res.json() as { success: boolean }
    expect(body.success).toBe(true)
  })

  it('rate limiter returns 429 after exceeding limit', async () => {
    const ip = '10.0.0.1'
    const headers = { 'x-forwarded-for': ip }

    // First 3 requests should succeed
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/api/v1/limited', { headers })
      expect(res.status).toBe(200)
    }

    // 4th request should be rate limited
    const res = await app.request('/api/v1/limited', { headers })
    expect(res.status).toBe(429)
    const body = await res.json() as { success: boolean; message: string }
    expect(body.success).toBe(false)
    expect(body.message).toContain('Too many requests')
  })
})
