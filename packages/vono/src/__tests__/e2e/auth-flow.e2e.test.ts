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
import { sign, verify } from 'hono/jwt'

// ─── Test app factory ─────────────────────────────────────────────────

const JWT_SECRET = 'test-secret-for-e2e-tests-only'
const ACCESS_TOKEN_TTL = 60 * 15 // 15 min
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7 // 7 days
const JWT_ALG = 'HS256' as const

interface User {
  id: string
  email: string
  passwordHash: string
}

function buildAuthApp() {
  const app = new Hono()

  // In-memory user store for tests
  const users = new Map<string, User>()
  const refreshTokens = new Set<string>()

  // Register
  app.post('/api/v1/auth/register', async (c) => {
    const body = await c.req.json() as { email: string; password: string }

    if (!body.email || !body.password) {
      return c.json({ success: false, message: 'Email and password required' }, 422)
    }

    if (users.has(body.email)) {
      return c.json({ success: false, message: 'Email already registered' }, 409)
    }

    const id = crypto.randomUUID()
    // Simulate password hashing
    const passwordHash = `hashed:${body.password}`
    users.set(body.email, { id, email: body.email, passwordHash })

    return c.json({ success: true, message: 'Account created', data: { id, email: body.email } }, 201)
  })

  // Login
  app.post('/api/v1/auth/login', async (c) => {
    const body = await c.req.json() as { email: string; password: string }
    const user = users.get(body.email)

    if (!user || user.passwordHash !== `hashed:${body.password}`) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    const now = Math.floor(Date.now() / 1000)

    const accessToken = await sign(
      { sub: user.id, email: user.email, exp: now + ACCESS_TOKEN_TTL },
      JWT_SECRET,
      JWT_ALG,
    )

    const refreshToken = await sign(
      { sub: user.id, type: 'refresh', exp: now + REFRESH_TOKEN_TTL },
      JWT_SECRET,
      JWT_ALG,
    )

    refreshTokens.add(refreshToken)

    return c.json({
      success: true,
      message: 'Login successful',
      data: { accessToken, refreshToken },
    })
  })

  // Protected route
  app.get('/api/v1/auth/me', async (c) => {
    const authHeader = c.req.header('Authorization') ?? c.req.header('authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

    try {
      const payload = await verify(token, JWT_SECRET, JWT_ALG) as { sub: string; email: string }
      return c.json({ success: true, data: { id: payload.sub, email: payload.email } })
    } catch {
      return c.json({ success: false, message: 'Invalid or expired token' }, 401)
    }
  })

  // Refresh token
  app.post('/api/v1/auth/refresh', async (c) => {
    const body = await c.req.json() as { refreshToken: string }

    if (!body.refreshToken || !refreshTokens.has(body.refreshToken)) {
      return c.json({ success: false, message: 'Invalid refresh token' }, 401)
    }

    try {
      const payload = await verify(body.refreshToken, JWT_SECRET, JWT_ALG) as { sub: string; type: string }

      if (payload.type !== 'refresh') {
        return c.json({ success: false, message: 'Invalid token type' }, 401)
      }

      const now = Math.floor(Date.now() / 1000)
      const newAccessToken = await sign(
        { sub: payload.sub, exp: now + ACCESS_TOKEN_TTL },
        JWT_SECRET,
        JWT_ALG,
      )

      return c.json({
        success: true,
        message: 'Token refreshed',
        data: { accessToken: newAccessToken },
      })
    } catch {
      return c.json({ success: false, message: 'Invalid or expired refresh token' }, 401)
    }
  })

  return app
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('auth flow e2e', () => {
  const app = buildAuthApp()

  it('register → login → access protected route → refresh token', async () => {
    // 1. Register
    const registerRes = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@example.com', password: 'password123' }),
    })

    expect(registerRes.status).toBe(201)
    const registerBody = await registerRes.json() as { success: boolean; data: { id: string } }
    expect(registerBody.success).toBe(true)
    expect(registerBody.data.id).toBeDefined()

    // 2. Login
    const loginRes = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@example.com', password: 'password123' }),
    })

    expect(loginRes.status).toBe(200)
    const loginBody = await loginRes.json() as {
      success: boolean
      data: { accessToken: string; refreshToken: string }
    }
    expect(loginBody.success).toBe(true)
    expect(loginBody.data.accessToken).toBeDefined()
    expect(loginBody.data.refreshToken).toBeDefined()

    const { accessToken, refreshToken } = loginBody.data

    // 3. Access protected route
    const meRes = await app.request('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(meRes.status).toBe(200)
    const meBody = await meRes.json() as { success: boolean; data: { email: string } }
    expect(meBody.success).toBe(true)
    expect(meBody.data.email).toBe('bob@example.com')

    // 4. Refresh token
    const refreshRes = await app.request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    expect(refreshRes.status).toBe(200)
    const refreshBody = await refreshRes.json() as {
      success: boolean
      data: { accessToken: string }
    }
    expect(refreshBody.success).toBe(true)
    expect(refreshBody.data.accessToken).toBeDefined()
    // New token should be different from the original
    expect(refreshBody.data.accessToken).not.toBe(accessToken)
  })

  it('login with wrong password returns 401', async () => {
    // Register first
    await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'carol@example.com', password: 'correct' }),
    })

    const res = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'carol@example.com', password: 'wrong' }),
    })

    expect(res.status).toBe(401)
  })

  it('accessing protected route without token returns 401', async () => {
    const res = await app.request('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })

  it('duplicate registration returns 409', async () => {
    await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dave@example.com', password: 'pass' }),
    })

    const res = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dave@example.com', password: 'pass' }),
    })

    expect(res.status).toBe(409)
  })
})
