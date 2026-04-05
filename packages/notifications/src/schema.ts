/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'

// ─── notifications ────────────────────────────────────────────────────────────

/**
 * notifications — in-app notification records.
 * Soft-deleted via `deleted_at`; read state tracked via `read_at`.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    account_id: text('account_id').notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    data: jsonb('data'),
    read_at: timestamp('read_at', { withTimezone: true, mode: 'date' }),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (t) => [
    index('notifications_account_id_idx').on(t.account_id),
    index('notifications_type_idx').on(t.type),
    index('notifications_read_at_idx').on(t.read_at),
  ],
)

// ─── notification_preferences ─────────────────────────────────────────────────

/**
 * notification_preferences — per-account, per-type delivery preferences.
 */
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: text('id').primaryKey(),
    account_id: text('account_id').notNull(),
    type: text('type').notNull(),
    email_enabled: boolean('email_enabled').notNull().default(true),
    push_enabled: boolean('push_enabled').notNull().default(true),
    in_app_enabled: boolean('in_app_enabled').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('notification_prefs_account_id_idx').on(t.account_id),
    index('notification_prefs_type_idx').on(t.type),
  ],
)
