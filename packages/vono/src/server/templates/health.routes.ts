/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { Hono } from 'hono'

/**
 * Health check routes.
 *
 * Mounted at /health on the inner API router.
 * Returns a simple { status: 'ok', timestamp } payload.
 *
 * Usage (auto-registered via autoRegisterRoutes):
 *   GET /api/v1/health → { status: 'ok', timestamp: '...' }
 */
const healthRoutes = new Hono()

healthRoutes.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

export default healthRoutes
