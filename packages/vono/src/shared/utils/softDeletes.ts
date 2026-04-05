/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

/**
 * Soft delete helpers for Drizzle ORM.
 *
 * These functions return Drizzle SQL conditions for use in WHERE clauses.
 * They are designed to be composable with Drizzle's and()/or() operators.
 *
 * Property 6: withSoftDeletes then withTrashed override — applying
 * withSoftDeletes and then withTrashed returns the same result as
 * withTrashed alone (withTrashed overrides the soft-delete filter).
 */

// ─── Type helpers ───────────────────────────────────────────────────

/** Any Drizzle table that has a deletedAt column */
export interface SoftDeletableTable {
  deletedAt: unknown
}

// ─── Condition builders ─────────────────────────────────────────────

/**
 * Returns a condition that excludes soft-deleted records.
 * Use in WHERE clauses: .where(withSoftDeletes(table))
 */
export function withSoftDeletes(table: SoftDeletableTable) {
  // Dynamic import to avoid bundling drizzle-orm in non-drizzle contexts
  const { isNull } = require('drizzle-orm') as typeof import('drizzle-orm')
  return isNull(table.deletedAt)
}

/**
 * Returns a condition that includes ONLY soft-deleted records.
 * Use in WHERE clauses: .where(onlyTrashed(table))
 */
export function onlyTrashed(table: SoftDeletableTable) {
  const { isNotNull } = require('drizzle-orm') as typeof import('drizzle-orm')
  return isNotNull(table.deletedAt)
}

/**
 * Returns undefined — no filter applied, includes all records.
 * Use when you want to override withSoftDeletes.
 *
 * Property 6: withTrashed() overrides withSoftDeletes — returns undefined
 * so no deleted_at filter is applied.
 */
export function withTrashed(): undefined {
  return undefined
}

// ─── Mutation helpers ───────────────────────────────────────────────

/**
 * Soft-delete records matching the condition.
 * Sets deleted_at to the current timestamp.
 *
 * @returns Array of affected record IDs
 */
export async function softDelete<T extends { id: unknown }>(
  db: {
    update: (table: unknown) => {
      set: (values: unknown) => {
        where: (condition: unknown) => { returning: (cols: unknown) => Promise<T[]> }
      }
    }
  },
  table: SoftDeletableTable & { id: unknown },
  condition: unknown,
): Promise<T[]> {
  return (db as any)
    .update(table)
    .set({ deletedAt: new Date() })
    .where(condition)
    .returning({ id: (table as any).id })
}

/**
 * Permanently delete records matching the condition.
 *
 * @returns Array of affected record IDs
 */
export async function forceDelete<T extends { id: unknown }>(
  db: {
    delete: (table: unknown) => {
      where: (condition: unknown) => { returning: (cols: unknown) => Promise<T[]> }
    }
  },
  table: { id: unknown },
  condition: unknown,
): Promise<T[]> {
  return (db as any)
    .delete(table)
    .where(condition)
    .returning({ id: (table as any).id })
}

/**
 * Restore a soft-deleted record by setting deleted_at to NULL.
 */
export async function restore(
  db: {
    update: (table: unknown) => {
      set: (values: unknown) => {
        where: (condition: unknown) => Promise<unknown>
      }
    }
  },
  table: SoftDeletableTable,
  condition: unknown,
): Promise<void> {
  await (db as any)
    .update(table)
    .set({ deletedAt: null })
    .where(condition)
}
