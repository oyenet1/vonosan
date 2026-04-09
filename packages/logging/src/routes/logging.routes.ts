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
import type { AppVariables } from 'vonosan/types'
import { ApiResponse } from 'vonosan/server'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { LoggingService } from '../service/logging.service.js'

/**
 * Admin-only activity log query endpoint.
 * Mount behind `isAdmin` middleware.
 */
const loggingRouter = new Hono<{ Variables: AppVariables }>()

loggingRouter.get('/', async (c) => {
  const service = new LoggingService(c.var.db as PostgresJsDatabase)

  const page = Number(c.req.query('page') ?? 1)
  const limit = Number(c.req.query('limit') ?? 50)
  const actorId = c.req.query('actorId')
  const action = c.req.query('action')
  const resourceType = c.req.query('resourceType')
  const startDate = c.req.query('startDate') ? new Date(c.req.query('startDate')!) : undefined
  const endDate = c.req.query('endDate') ? new Date(c.req.query('endDate')!) : undefined

  const result = await service.query({ actorId, action, resourceType, startDate, endDate, page, limit })
  return c.json(ApiResponse.success(result, 'Activity logs retrieved'))
})

export default loggingRouter
