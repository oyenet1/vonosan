/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http'
import postgres from 'postgres'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'

// ─── Types ──────────────────────────────────────────────────────────

export type PoolingStrategy = 'shared' | 'hyperdrive' | 'http-serverless'

export interface PooledDbResult {
  db: PostgresJsDatabase | NeonHttpDatabase
  /** Call end() to release the connection (no-op for shared pool) */
  end: () => Promise<void>
}

// ─── Shared pool (Node / Bun) ────────────────────────────────────────

/**
 * Shared connection pool — reused across all requests in the same process.
 * Ideal for long-running Node.js or Bun servers.
 *
 * The pool is created once and never closed during the process lifetime.
 * Do NOT call end() on the returned client in request handlers.
 */
let _sharedPool: postgres.Sql | null = null

export function createSharedPool(connectionString: string): PooledDbResult {
  if (!_sharedPool) {
    _sharedPool = postgres(connectionString, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
    })
  }

  const db = drizzlePg(_sharedPool)

  return {
    db,
    // No-op: shared pool lives for the process lifetime
    end: async () => {},
  }
}

// ─── Per-request Hyperdrive (Cloudflare Workers) ─────────────────────

/**
 * Hyperdrive pooling — for Cloudflare Workers with a Hyperdrive binding.
 *
 * Each request gets a fresh connection via Hyperdrive's connection string.
 * The connection MUST be closed after the request (call end()).
 *
 * Usage in your worker:
 * ```ts
 * const { db, end } = createHyperdrivePool(env.HYPERDRIVE.connectionString)
 * try {
 *   // ... use db
 * } finally {
 *   await end()
 * }
 * ```
 */
export function createHyperdrivePool(hyperdriveConnectionString: string): PooledDbResult {
  // Hyperdrive provides a per-request connection string that routes through
  // its connection pool at the edge. We use a single connection per request.
  const client = postgres(hyperdriveConnectionString, {
    max: 1,
    // Hyperdrive manages the actual pool — keep local settings minimal
    idle_timeout: 5,
    connect_timeout: 5,
  })

  const db = drizzlePg(client)

  return {
    db,
    end: async () => {
      await client.end()
    },
  }
}

// ─── HTTP serverless (Vercel / Deno / Neon) ──────────────────────────

/**
 * HTTP serverless pooling — for Vercel Edge, Deno Deploy, or Neon serverless.
 *
 * Uses the Neon HTTP driver which sends queries over HTTPS instead of
 * a persistent TCP connection. No connection management needed.
 *
 * Usage:
 * ```ts
 * const { db } = createHttpServerlessPool(process.env.DATABASE_URL!)
 * const users = await db.select().from(usersTable)
 * // No need to call end() — HTTP is stateless
 * ```
 */
export function createHttpServerlessPool(connectionString: string): PooledDbResult {
  // neon() from @neondatabase/serverless accepts a connection string
  // and returns a query function compatible with drizzle-orm/neon-http
  const { neon } = await importNeon()
  const sql = neon(connectionString)
  const db = drizzleHttp(sql)

  return {
    db,
    // HTTP is stateless — no connection to close
    end: async () => {},
  }
}

/**
 * Lazy-import @neondatabase/serverless to avoid bundling it in non-serverless targets.
 */
async function importNeon(): Promise<{ neon: (connectionString: string) => unknown }> {
  try {
    return await import('@neondatabase/serverless') as { neon: (connectionString: string) => unknown }
  } catch {
    throw new Error(
      '[vono/drizzle] HTTP serverless pooling requires @neondatabase/serverless. ' +
      'Install it: bun add @neondatabase/serverless',
    )
  }
}

// ─── Auto-resolver ───────────────────────────────────────────────────

/**
 * resolvePoolingStrategy — pick the right pooling strategy automatically.
 *
 * Detection order:
 *   1. CF Workers: HYPERDRIVE binding present → hyperdrive
 *   2. Vercel/Deno: process.env.VERCEL or Deno global → http-serverless
 *   3. Node/Bun: everything else → shared pool
 */
export function resolvePoolingStrategy(): PoolingStrategy {
  // Cloudflare Workers: no process.env, but env bindings are passed per-request
  // The caller should check for HYPERDRIVE binding and call createHyperdrivePool directly.

  // Vercel serverless
  if (typeof process !== 'undefined' && process.env['VERCEL']) {
    return 'http-serverless'
  }

  // Deno Deploy
  if (typeof (globalThis as Record<string, unknown>)['Deno'] !== 'undefined') {
    return 'http-serverless'
  }

  // Node / Bun — long-running process, use shared pool
  return 'shared'
}
