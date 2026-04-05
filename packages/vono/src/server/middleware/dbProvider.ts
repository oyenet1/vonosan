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

/**
 * DB provider middleware.
 *
 * Creates a Drizzle client per request (or uses a shared pool for Node/Bun),
 * sets c.var.db, and always closes the connection in a finally block.
 *
 * The actual createDb factory is resolved at runtime from the project's
 * src/db/index.ts — this middleware is runtime-agnostic.
 *
 * Apply once on the inner API router:
 *   api.use('*', dbProvider)
 */
export const dbProvider = createMiddleware<{
  Variables: AppVariables
  Bindings: Env
}>(async (c, next) => {
  const config = c.get('config')
  const env = c.env as Env

  // Resolve connection string:
  // - Cloudflare Workers: use Hyperdrive binding
  // - Node/Bun: use DATABASE_URL from config
  const connectionString =
    env?.HYPERDRIVE?.connectionString ?? config?.DATABASE_URL ?? ''

  if (!connectionString) {
    throw new Error(
      '[vono] dbProvider: No database connection string found. ' +
      'Set DATABASE_URL in your .env file.',
    )
  }

  // Dynamically import createDb from the project's db module.
  // This allows the project to swap the DB driver without changing framework code.
  let db: unknown
  let client: { end?: () => Promise<void> } | null = null

  try {
    // Try to import the project's createDb factory
    const dbModule = await import('/src/db/index.js').catch(() => null)

    if (dbModule?.createDb) {
      const result = await dbModule.createDb(connectionString)
      db = result.db
      client = result.client
    } else {
      // Fallback: set db to null — project must handle this
      Logger.warn('[vono] dbProvider: Could not load src/db/index.js. DB will be null.')
      db = null
    }

    c.set('db', db)
    await next()
  } finally {
    // Always close the connection after the request
    if (client?.end) {
      await client.end().catch((err: unknown) => {
        Logger.error('[vono] dbProvider: Error closing DB connection', {
          error: String(err),
        })
      })
    }
  }
})
