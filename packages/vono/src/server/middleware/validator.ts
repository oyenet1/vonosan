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
import type { ZodSchema, ZodError } from 'zod'

// ─── Types ──────────────────────────────────────────────────────────

/**
 * The part of the request to validate.
 *   - 'json'   — c.req.json()
 *   - 'query'  — c.req.query() (all query params as an object)
 *   - 'param'  — c.req.param() (URL path params)
 *   - 'header' — c.req.header() (request headers)
 *   - 'form'   — c.req.formData() (multipart/form-data or urlencoded)
 */
export type ValidatorTarget = 'json' | 'query' | 'param' | 'header' | 'form'

export interface ValidationErrorBody {
  success: false
  statusCode: 422
  message: string
  errors: Record<string, string>
}

// ─── Middleware factory ──────────────────────────────────────────────

/**
 * zodValidator — Hono middleware factory for request validation.
 *
 * Validates the specified part of the request against a Zod schema.
 * On failure, returns HTTP 422 with a structured error body.
 * On success, sets the parsed data on `c.var` under the target key
 * so downstream handlers can access it type-safely.
 *
 * Usage:
 * ```ts
 * import { zodValidator } from 'vonosan/server'
 * import { z } from 'zod'
 *
 * const CreateUserSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * })
 *
 * router.post('/users',
 *   zodValidator('json', CreateUserSchema),
 *   async (c) => {
 *     const body = c.var.json as z.infer<typeof CreateUserSchema>
 *     // body is fully typed and validated
 *   }
 * )
 * ```
 *
 * @param target — which part of the request to validate
 * @param schema — Zod schema to validate against
 */
export function zodValidator<T>(target: ValidatorTarget, schema: ZodSchema<T>) {
  return createMiddleware(async (c, next) => {
    let rawData: unknown

    // Extract raw data from the appropriate request part
    switch (target) {
      case 'json': {
        try {
          rawData = await c.req.json()
        } catch {
          return c.json(
            buildErrorBody('Invalid JSON body'),
            422,
          )
        }
        break
      }
      case 'query': {
        rawData = c.req.query()
        break
      }
      case 'param': {
        rawData = c.req.param()
        break
      }
      case 'header': {
        // Convert Headers to a plain object
        const headers: Record<string, string> = {}
        c.req.raw.headers.forEach((value, key) => {
          headers[key] = value
        })
        rawData = headers
        break
      }
      case 'form': {
        try {
          const formData = await c.req.formData()
          const obj: Record<string, string | File> = {}
          formData.forEach((value, key) => {
            obj[key] = value
          })
          rawData = obj
        } catch {
          return c.json(
            buildErrorBody('Invalid form data'),
            422,
          )
        }
        break
      }
    }

    // Run Zod validation
    const result = schema.safeParse(rawData)

    if (!result.success) {
      const errors = flattenZodErrors(result.error)
      return c.json(
        {
          success: false as const,
          statusCode: 422 as const,
          message: 'Validation failed',
          errors,
        } satisfies ValidationErrorBody,
        422,
      )
    }

    // Store parsed data on c.var so handlers can access it
    c.set(target as string, result.data)

    await next()
  })
}

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Flatten Zod errors into a { field: message } map.
 * For nested fields, the key is dot-separated (e.g. "address.city").
 */
function flattenZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_root'
    // Keep the first error per field
    if (!errors[field]) {
      errors[field] = issue.message
    }
  }

  return errors
}

function buildErrorBody(message: string): ValidationErrorBody {
  return {
    success: false,
    statusCode: 422,
    message,
    errors: {},
  }
}
