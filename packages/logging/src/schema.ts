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
  jsonb,
  index,
} from 'drizzle-orm/pg-core'

// ─── activity_logs ────────────────────────────────────────────────────────────

/**
 * activity_logs — immutable audit trail of actor actions on resources.
 * Never soft-deleted; records are permanent for compliance.
 */
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: text('id').primaryKey(),
    actor_id: text('actor_id'),
    action: text('action').notNull(),
    resource_type: text('resource_type'),
    resource_id: text('resource_id'),
    ip: text('ip'),
    user_agent: text('user_agent'),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('activity_logs_actor_id_idx').on(t.actor_id),
    index('activity_logs_action_idx').on(t.action),
    index('activity_logs_resource_type_idx').on(t.resource_type),
    index('activity_logs_created_at_idx').on(t.created_at),
  ],
)
