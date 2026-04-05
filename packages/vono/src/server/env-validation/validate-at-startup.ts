/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { ZodSchema, ZodError } from 'zod'

// ─── validateEnvAtStartup ────────────────────────────────────────────

/**
 * validateEnvAtStartup — validates env vars before accepting requests.
 *
 * On failure: prints a formatted error message and calls process.exit(1).
 * On success: returns the typed, validated config object.
 *
 * Error format:
 * ```
 * [vono] Missing/invalid env vars:
 *   ❌ DATABASE_URL: Invalid url
 *   ❌ JWT_SECRET: String must contain at least 32 character(s)
 * ```
 *
 * @param schema — Zod schema to validate against
 * @param env    — raw environment variables map
 * @param refine — optional cross-field validation function
 */
export function validateEnvAtStartup<T>(
  schema: ZodSchema<T>,
  env: Record<string, string | undefined>,
  refine?: (env: T) => boolean | string,
): T {
  const result = schema.safeParse(env)

  if (!result.success) {
    const errors = formatZodErrors(result.error)
    const message = `[vono] Missing/invalid env vars:\n${errors}`

    process.stderr.write(message + '\n')
    process.exit(1)
  }

  // Cross-field validation
  if (refine) {
    const refineResult = refine(result.data)

    if (refineResult !== true) {
      const message =
        typeof refineResult === 'string'
          ? `[vono] Env validation failed:\n  ❌ ${refineResult}`
          : `[vono] Env validation failed: refine() returned false`

      process.stderr.write(message + '\n')
      process.exit(1)
    }
  }

  return result.data
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Format Zod errors into the standard Vono error format.
 */
function formatZodErrors(error: ZodError): string {
  const lines: string[] = []

  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root'
    lines.push(`  ❌ ${key}: ${issue.message}`)
  }

  return lines.join('\n')
}
