/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { Config } from '../../types/index.js'
import type { Logger } from '../../shared/utils/logger.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JobContext {
  /** Drizzle database instance */
  db: PostgresJsDatabase
  /** Validated app config */
  config: Config
  /** Structured logger */
  logger: typeof Logger
}

export interface JobDefinition {
  /** Unique job name — used for `vono jobs:run <name>` */
  name: string
  /** Cron schedule expression (e.g. '0 * * * *' for every hour) */
  schedule: string
  /** Human-readable description */
  description?: string
  /** Job handler — receives db, config, and logger */
  handler: (ctx: JobContext) => Promise<void>
}

// ─── defineJob ────────────────────────────────────────────────────────────────

/**
 * `defineJob({ name, schedule, description, handler })` — registers a cron job.
 *
 * Returns the job definition object. Pass it to `startJobs()` to activate.
 *
 * @example
 * ```ts
 * export const cleanupJob = defineJob({
 *   name: 'cleanup-expired-sessions',
 *   schedule: '0 2 * * *', // 2am daily
 *   description: 'Remove expired auth sessions',
 *   async handler({ db, logger }) {
 *     const deleted = await db.delete(authSessions).where(lt(authSessions.expires_at, new Date()))
 *     logger.info('Expired sessions cleaned', { count: deleted.rowCount })
 *   },
 * })
 * ```
 */
export function defineJob(definition: JobDefinition): JobDefinition {
  return definition
}
