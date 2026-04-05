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
 * Convert a single snake_case string to camelCase.
 * e.g. "user_id" → "userId", "created_at" → "createdAt"
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}

/**
 * Recursively convert all snake_case keys in a plain object (or array)
 * to camelCase. Idempotent — applying twice yields the same result.
 *
 * Property 7: toCamel(toCamel(obj)) === toCamel(obj)
 * Property 8: no snake_case keys remain at any nesting level
 */
export function toCamel<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamel(item)) as unknown as T
  }

  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[snakeToCamel(key)] = toCamel(value)
    }
    return result as T
  }

  return obj
}
