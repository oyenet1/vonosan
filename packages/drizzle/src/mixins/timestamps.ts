/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { timestamp } from 'drizzle-orm/pg-core'

/**
 * timestamps — Drizzle mixin adding `created_at` and `updated_at` columns.
 *
 * Every table MUST include these columns per project conventions.
 *
 * Usage:
 * ```ts
 * import { pgTable, text } from 'drizzle-orm/pg-core'
 * import { timestamps } from '@vonosan/drizzle'
 *
 * export const users = pgTable('users', {
 *   id: text('id').primaryKey(),
 *   email: text('email').notNull(),
 *   ...timestamps,
 * })
 * ```
 */
export const timestamps = {
  /**
   * created_at — set once at insert time, never updated.
   */
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),

  /**
   * updated_at — updated on every row modification.
   * Use a DB trigger or ORM hook to keep this current.
   */
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
} as const
