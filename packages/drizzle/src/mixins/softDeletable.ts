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
 * softDeletable — Drizzle mixin adding a `deleted_at` nullable timestamp.
 *
 * For SaaS products, every table MUST use soft deletes instead of
 * permanently destroying records. Combine with the `withSoftDeletes`,
 * `onlyTrashed`, and `withTrashed` query helpers from `vonosan/server`.
 *
 * Usage:
 * ```ts
 * import { pgTable, text } from 'drizzle-orm/pg-core'
 * import { timestamps, softDeletable } from '@vonosan/drizzle'
 *
 * export const users = pgTable('users', {
 *   id: text('id').primaryKey(),
 *   email: text('email').notNull(),
 *   ...timestamps,
 *   ...softDeletable,
 * })
 * ```
 */
export const softDeletable = {
  /**
   * deleted_at — null means the record is active.
   * A non-null value means the record has been soft-deleted.
   */
  deleted_at: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
} as const
