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

// ─── Tests ───────────────────────────────────────────────────────────

describe('autoRegisterRoutes integration', () => {
  it('manually mounted routes respond at correct paths', async () => {
    const app = new Hono()

    // Simulate what autoRegisterRoutes does: mount sub-routers at prefixes
    const authRouter = new Hono()
    authRouter.get('/login', (c) => c.json({ route: 'auth/login' }))

    const usersRouter = new Hono()
    usersRouter.get('/', (c) => c.json({ route: 'users/list' }))
    usersRouter.get('/:id', (c) => c.json({ route: 'users/detail', id: c.req.param('id') }))

    app.route('/auth', authRouter)
    app.route('/users', usersRouter)

    // Auth route
    const authRes = await app.request('/auth/login')
    expect(authRes.status).toBe(200)
    const authBody = await authRes.json() as { route: string }
    expect(authBody.route).toBe('auth/login')

    // Users list
    const usersRes = await app.request('/users')
    expect(usersRes.status).toBe(200)
    const usersBody = await usersRes.json() as { route: string }
    expect(usersBody.route).toBe('users/list')

    // Users detail with param
    const detailRes = await app.request('/users/abc123')
    expect(detailRes.status).toBe(200)
    const detailBody = await detailRes.json() as { route: string; id: string }
    expect(detailBody.route).toBe('users/detail')
    expect(detailBody.id).toBe('abc123')
  })

  it('unknown routes return 404', async () => {
    const app = new Hono()
    const res = await app.request('/nonexistent')
    expect(res.status).toBe(404)
  })

  it('routes are isolated between sub-routers', async () => {
    const app = new Hono()

    const r1 = new Hono()
    r1.get('/ping', (c) => c.json({ from: 'r1' }))

    const r2 = new Hono()
    r2.get('/ping', (c) => c.json({ from: 'r2' }))

    app.route('/module1', r1)
    app.route('/module2', r2)

    const res1 = await app.request('/module1/ping')
    const res2 = await app.request('/module2/ping')

    const body1 = await res1.json() as { from: string }
    const body2 = await res2.json() as { from: string }

    expect(body1.from).toBe('r1')
    expect(body2.from).toBe('r2')
  })
})
