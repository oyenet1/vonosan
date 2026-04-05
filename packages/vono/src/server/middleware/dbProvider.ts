/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { createMiddleware } from 'hono/factory'
import type { AppVariables, Env } from '../../types/index.js'
import { Logger } from '../../shared/utils/logger.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DbFactory {
  createDb: (connectionString: string) => Promise<{
    db: unknown
    client: { end?: () => Promise<void> }
  }>
}

// Module-level factory — set once at startup by the consuming project
let _dbFactory: DbFactory | null = null

/**
 * Register the project's createDb factory.
 * Call this in your src/index.ts before starting the server:
 *
 * ```ts
 * import { registerDbFactory } from 'vono/server'
 * import { createDb } from './db/index.js'
 * registerDbFactory({ createDb })
 * ```
 */
export function registerDbFactory(factory: DbFactory): void {
  _dbFactory = factory
}

/**
 * DB provider middleware.
 *
 * Creates a Drizzle client per request, sets c.var.db, and always
 * closes the connection in a finally block.
 *
 * Requires registerDbFactory() to be called at startup.
 */
export const dbProvider = createMiddleware<{
  Variables: AppVariables
  Bindings: Env
}>(async (c, next) => {
  const config = c.get('config')
  const env = c.env as Env

  const connectionString =
    env?.HYPERDRIVE?.connectionString ?? config?.DATABASE_URL ?? ''

  if (!connectionString) {
    throw new Error(
      '[vono] dbProvider: No database connection string found. ' +
      'Set DATABASE_URL in your .env file.',
    )
  }

  if (!_dbFactory) {
    throw new Error(
      '[vono] dbProvider: No DB factory registered. ' +
      'Call registerDbFactory({ createDb }) in your src/index.ts.',
    )
  }

  let client: { end?: () => Promise<void> } | null = null

  try {
    const result = await _dbFactory.createDb(connectionString)
    client = result.client
    c.set('db', result.db)
    await next()
  } finally {
    if (client?.end) {
      await client.end().catch((err: unknown) => {
        Logger.error('[vono] dbProvider: Error closing DB connection', {
          error: String(err),
        })
      })
    }
  }
})
