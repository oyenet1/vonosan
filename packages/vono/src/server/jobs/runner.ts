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
import { Logger } from '../../shared/utils/logger.js'
import type { JobDefinition } from './define-job.js'

// ─── startJobs ────────────────────────────────────────────────────────────────

/**
 * `startJobs(jobs, db, config)` — starts all registered cron jobs.
 *
 * Uses `node-cron` for Node/Bun targets. Dynamically imported to avoid
 * bundling it in Cloudflare Workers builds.
 *
 * For CF Workers, use `[triggers]` in `wrangler.jsonc` instead.
 * For Vercel, use `vercel.json` crons config instead.
 *
 * @example
 * ```ts
 * import { startJobs } from 'vono/server'
 * import { cleanupJob } from './jobs/cleanup.job'
 *
 * startJobs([cleanupJob], db, config)
 * ```
 */
export async function startJobs(
  jobs: JobDefinition[],
  db: PostgresJsDatabase,
  config: Config,
): Promise<void> {
  if (jobs.length === 0) {
    Logger.info('[jobs] No jobs registered')
    return
  }

  // Dynamically import node-cron — not available in CF Workers
  let cron: { schedule: (expr: string, fn: () => void) => void }
  try {
    cron = await import('node-cron') as typeof cron
  } catch {
    Logger.warn('[jobs] node-cron not installed — jobs will not run automatically. ' +
      'Install it with: bun add node-cron')
    return
  }

  for (const job of jobs) {
    Logger.info('[jobs] Scheduling job', { name: job.name, schedule: job.schedule })

    cron.schedule(job.schedule, async () => {
      Logger.info('[jobs] Running job', { name: job.name })
      try {
        await job.handler({ db, config, logger: Logger })
        Logger.info('[jobs] Job completed', { name: job.name })
      } catch (err) {
        Logger.error('[jobs] Job failed', { name: job.name, error: String(err) })
      }
    })
  }

  Logger.info('[jobs] All jobs scheduled', { count: jobs.length })
}

// ─── runJobNow ────────────────────────────────────────────────────────────────

/**
 * `runJobNow(name, jobs, db, config)` — executes a named job immediately.
 *
 * Used by `vono jobs:run <name>` CLI command.
 */
export async function runJobNow(
  name: string,
  jobs: JobDefinition[],
  db: PostgresJsDatabase,
  config: Config,
): Promise<void> {
  const job = jobs.find((j) => j.name === name)

  if (!job) {
    const available = jobs.map((j) => j.name).join(', ')
    throw new Error(
      `[jobs] Job "${name}" not found. Available jobs: ${available || '(none)'}`,
    )
  }

  Logger.info('[jobs] Running job immediately', { name: job.name })
  await job.handler({ db, config, logger: Logger })
  Logger.info('[jobs] Job completed', { name: job.name })
}
