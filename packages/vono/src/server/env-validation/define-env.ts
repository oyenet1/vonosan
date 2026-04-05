/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { ZodSchema } from 'zod'
import { validateEnvAtStartup } from './validate-at-startup.js'

// ─── defineEnv ───────────────────────────────────────────────────────

export interface DefineEnvOptions<T> {
  /**
   * Optional cross-field validation function.
   * Return true to pass, or a string error message to fail.
   */
  refine?: (env: T) => boolean | string
}

/**
 * defineEnv — wraps Zod validation for environment variables.
 *
 * Validates `process.env` against the provided schema at call time.
 * On failure: prints a formatted error listing each failing variable
 * with its Zod message, then calls `process.exit(1)`.
 *
 * @example
 * ```ts
 * // src/env.ts
 * import { defineEnv } from 'vono/server'
 * import { z } from 'zod'
 *
 * export const env = defineEnv(
 *   z.object({
 *     DATABASE_URL: z.string().url(),
 *     JWT_SECRET: z.string().min(32),
 *     PORT: z.coerce.number().default(4000),
 *   }),
 *   {
 *     refine: (e) =>
 *       e.JWT_SECRET !== 'change-me' || 'JWT_SECRET must not be the default value',
 *   },
 * )
 * ```
 */
export function defineEnv<T>(
  schema: ZodSchema<T>,
  options?: DefineEnvOptions<T>,
): T {
  const rawEnv = typeof process !== 'undefined' ? process.env : {}
  return validateEnvAtStartup(schema, rawEnv as Record<string, string>, options?.refine)
}
