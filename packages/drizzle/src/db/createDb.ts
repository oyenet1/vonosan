/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

// ─── Types ──────────────────────────────────────────────────────────

export interface DbClient {
  /** The Drizzle ORM instance — use this for all queries */
  db: PostgresJsDatabase
  /** The underlying postgres.js client — call client.end() to close */
  client: postgres.Sql
}

// ─── Factory ────────────────────────────────────────────────────────

/**
 * createDb — create a Drizzle ORM instance from a connection string.
 *
 * Returns both the Drizzle `db` instance and the raw `client` so the
 * caller can close the connection when the request is done.
 *
 * The `dbProvider` middleware calls this automatically. You only need
 * to call it directly in scripts, seeds, or migrations.
 *
 * Usage:
 * ```ts
 * import { createDb } from '@vono/drizzle'
 *
 * const { db, client } = createDb(process.env.DATABASE_URL!)
 * const users = await db.select().from(usersTable)
 * await client.end()
 * ```
 *
 * @param connectionString — PostgreSQL connection string (postgres://)
 * @param options — optional postgres.js Options override
 */
export function createDb(
  connectionString: string,
  options?: postgres.Options<Record<string, postgres.PostgresType>>,
): DbClient {
  if (!connectionString) {
    throw new Error(
      '[vono/drizzle] createDb: connectionString is required. ' +
      'Set DATABASE_URL in your .env file.',
    )
  }

  const client = postgres(connectionString, {
    // Sensible defaults — override via options
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ...options,
  })

  const db = drizzle(client)

  return { db, client }
}
