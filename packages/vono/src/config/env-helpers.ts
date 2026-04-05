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
 * Read an env var with an optional fallback.
 * Returns the fallback (or empty string) if the key is not set.
 */
export function env(key: string, fallback = ''): string {
  return (typeof process !== 'undefined' ? process.env[key] : undefined) ?? fallback
}

/**
 * Read an env var and parse it as a number.
 * Returns the fallback if the key is not set or not a valid number.
 */
export function envNumber(key: string, fallback: number): number {
  const raw = env(key)
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? fallback : parsed
}

/**
 * Read an env var and parse it as a boolean.
 * "true", "1", "yes" → true. Everything else → false.
 */
export function envBool(key: string, fallback: boolean): boolean {
  const raw = env(key)
  if (!raw) return fallback
  return ['true', '1', 'yes'].includes(raw.toLowerCase())
}

/**
 * Read a required env var. Throws at startup if missing.
 * Use this for vars that MUST be present (e.g. JWT_SECRET).
 */
export function envRequired(key: string): string {
  const value = env(key)
  if (!value) {
    throw new Error(
      `[vono] Missing required environment variable: ${key}\n` +
      `Add it to your .env file and .env.example.`,
    )
  }
  return value
}
