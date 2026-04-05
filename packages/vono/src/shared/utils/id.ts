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
 * Generate a UUID v4 string using the Web Crypto API.
 * Works on all runtimes: Node.js, Bun, Deno, Cloudflare Workers.
 *
 * Property 14: returned value matches UUID v4 pattern
 * xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Generate a prefixed ID in the format `<prefix>_<uuid>`.
 * e.g. prefixedId('usr') → 'usr_550e8400-e29b-41d4-a716-446655440000'
 *
 * Property 15: prefixedId(prefix).split('_')[0] === prefix
 */
export function prefixedId(prefix: string): string {
  return `${prefix}_${generateId()}`
}
