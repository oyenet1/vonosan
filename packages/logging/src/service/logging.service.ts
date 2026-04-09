/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { eq, and, gte, lte, desc } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { generateId, buildPaginationMeta, Logger } from 'vonosan/server'
import { activityLogs } from '../schema.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LogQueryFilters {
  actorId?: string
  action?: string
  resourceType?: string
  startDate?: Date
  endDate?: Date
  page: number
  limit: number
}

// ─── LoggingService ───────────────────────────────────────────────────────────

/**
 * LoggingService — creates and queries activity audit logs.
 */
export class LoggingService {
  constructor(private readonly db: PostgresJsDatabase) {}

  // ─── log ────────────────────────────────────────────────────────────────────

  /**
   * Create an activity log entry.
   * Dispatches to queue if available, otherwise inserts synchronously.
   */
  async log(
    actorId: string | null,
    action: string,
    resourceType?: string,
    resourceId?: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const id = generateId()

    // Synchronous insert (queue dispatch would be wired here when available)
    await this.db.insert(activityLogs).values({
      id,
      actor_id: actorId,
      action,
      resource_type: resourceType ?? null,
      resource_id: resourceId ?? null,
      ip: ip ?? null,
      user_agent: userAgent ?? null,
      metadata: metadata ?? null,
    })

    Logger.debug('[logging] Activity logged', { id, actorId, action, resourceType })
  }

  // ─── query ──────────────────────────────────────────────────────────────────

  /**
   * Paginated query of activity logs with optional filters.
   */
  async query(filters: LogQueryFilters) {
    const { actorId, action, resourceType, startDate, endDate, page, limit } = filters
    const offset = (page - 1) * limit

    const conditions = []
    if (actorId) conditions.push(eq(activityLogs.actor_id, actorId))
    if (action) conditions.push(eq(activityLogs.action, action))
    if (resourceType) conditions.push(eq(activityLogs.resource_type, resourceType))
    if (startDate) conditions.push(gte(activityLogs.created_at, startDate))
    if (endDate) conditions.push(lte(activityLogs.created_at, endDate))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await this.db
      .select()
      .from(activityLogs)
      .where(where)
      .orderBy(desc(activityLogs.created_at))
      .limit(limit)
      .offset(offset)

    const countRows = await this.db
      .select({ id: activityLogs.id })
      .from(activityLogs)
      .where(where)

    const total = countRows.length
    return { items: rows, meta: buildPaginationMeta(page, limit, total) }
  }
}
