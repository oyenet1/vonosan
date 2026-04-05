/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { Context } from 'hono'
import type { AppVariables } from 'vono/types'
import { ApiResponse } from 'vono/server'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { NotificationsService } from '../service/notifications.service.js'

type AppContext = Context<{ Variables: AppVariables }>

function getService(c: AppContext) {
  return new NotificationsService(c.var.db as PostgresJsDatabase)
}

// ─── Controllers ─────────────────────────────────────────────────────────────

export async function listNotifications(c: AppContext) {
  const accountId = c.var.account.id
  const page = Number(c.req.query('page') ?? 1)
  const limit = Number(c.req.query('limit') ?? 20)
  const result = await getService(c).list(accountId, page, limit)
  return c.json(ApiResponse.success(result, 'Notifications retrieved'))
}

export async function markNotificationRead(c: AppContext) {
  const id = c.req.param('id')
  await getService(c).markRead(id, c.var.account.id)
  return c.json(ApiResponse.success(null, 'Notification marked as read'))
}

export async function markAllNotificationsRead(c: AppContext) {
  await getService(c).markAllRead(c.var.account.id)
  return c.json(ApiResponse.success(null, 'All notifications marked as read'))
}

export async function deleteNotification(c: AppContext) {
  const id = c.req.param('id')
  await getService(c).delete(id, c.var.account.id)
  return c.json(ApiResponse.success(null, 'Notification deleted'))
}

export async function getNotificationPreferences(c: AppContext) {
  const prefs = await getService(c).getPreferences(c.var.account.id)
  return c.json(ApiResponse.success(prefs, 'Preferences retrieved'))
}

export async function updateNotificationPreferences(c: AppContext) {
  const { type, ...data } = await c.req.json<{ type: string; email_enabled?: boolean; push_enabled?: boolean; in_app_enabled?: boolean }>()
  await getService(c).updatePreferences(c.var.account.id, type, data)
  return c.json(ApiResponse.success(null, 'Preferences updated'))
}
