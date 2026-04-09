/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { eq, and, isNull, desc } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { generateId, buildPaginationMeta, Logger } from 'vonosan/server'
import { notifications, notificationPreferences } from '../schema.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NotificationPreferenceUpdate {
  email_enabled?: boolean
  push_enabled?: boolean
  in_app_enabled?: boolean
}

// ─── NotificationsService ─────────────────────────────────────────────────────

/**
 * NotificationsService — manages in-app notifications and delivery preferences.
 */
export class NotificationsService {
  constructor(private readonly db: PostgresJsDatabase) {}

  // ─── list ───────────────────────────────────────────────────────────────────

  /**
   * Paginated list of notifications for an account (excludes soft-deleted).
   */
  async list(accountId: string, page: number, limit: number) {
    const offset = (page - 1) * limit

    const rows = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.account_id, accountId), isNull(notifications.deleted_at)))
      .orderBy(desc(notifications.created_at))
      .limit(limit)
      .offset(offset)

    // Count total
    const countRows = await this.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.account_id, accountId), isNull(notifications.deleted_at)))

    const total = countRows.length
    return { items: rows, meta: buildPaginationMeta(page, limit, total) }
  }

  // ─── markRead ───────────────────────────────────────────────────────────────

  /**
   * Mark a single notification as read.
   */
  async markRead(id: string, accountId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ read_at: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.account_id, accountId)))
  }

  // ─── markAllRead ────────────────────────────────────────────────────────────

  /**
   * Mark all unread notifications for an account as read.
   */
  async markAllRead(accountId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ read_at: new Date() })
      .where(and(eq(notifications.account_id, accountId), isNull(notifications.read_at)))
  }

  // ─── delete ─────────────────────────────────────────────────────────────────

  /**
   * Soft-delete a notification.
   */
  async delete(id: string, accountId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ deleted_at: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.account_id, accountId)))
  }

  // ─── getPreferences ─────────────────────────────────────────────────────────

  /**
   * Get all notification preferences for an account.
   */
  async getPreferences(accountId: string) {
    return this.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.account_id, accountId))
  }

  // ─── updatePreferences ──────────────────────────────────────────────────────

  /**
   * Upsert notification preferences for a specific type.
   */
  async updatePreferences(
    accountId: string,
    type: string,
    data: NotificationPreferenceUpdate,
  ) {
    const existing = await this.db
      .select({ id: notificationPreferences.id })
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.account_id, accountId),
          eq(notificationPreferences.type, type),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      await this.db
        .update(notificationPreferences)
        .set({ ...data, updated_at: new Date() })
        .where(eq(notificationPreferences.id, existing[0].id))
    } else {
      await this.db.insert(notificationPreferences).values({
        id: generateId(),
        account_id: accountId,
        type,
        email_enabled: data.email_enabled ?? true,
        push_enabled: data.push_enabled ?? true,
        in_app_enabled: data.in_app_enabled ?? true,
      })
    }
  }

  // ─── create ─────────────────────────────────────────────────────────────────

  /**
   * Create a notification.
   * Dispatches to queue if available, otherwise inserts synchronously.
   */
  async create(
    accountId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const id = generateId()

    // Synchronous insert (queue dispatch would be wired here when available)
    await this.db.insert(notifications).values({
      id,
      account_id: accountId,
      type,
      title,
      body,
      data: data ?? null,
    })

    Logger.info('[notifications] Notification created', { id, accountId, type })
    return { id }
  }
}
