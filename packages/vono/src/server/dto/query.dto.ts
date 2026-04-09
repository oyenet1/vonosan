/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { z } from 'zod'

/**
 * QuerySchema — standard query parameter schema for list/collection endpoints.
 *
 * All fields are optional with sensible defaults. Query params arrive as
 * strings from the URL, so coercion is applied where needed.
 *
 * Usage with zodValidator:
 * ```ts
 * import { zodValidator, QuerySchema } from 'vonosan/server'
 *
 * router.get('/users',
 *   zodValidator('query', QuerySchema),
 *   async (c) => {
 *     const query = c.var.query as QueryDto
 *     const { page, limit, q, sortBy, sortOrder } = query
 *   }
 * )
 * ```
 */
export const QuerySchema = z.object({
  /**
   * Current page number (1-indexed).
   * Coerced from string → number. Defaults to 1.
   */
  page: z.coerce
    .number({ invalid_type_error: 'page must be a number' })
    .int('page must be an integer')
    .min(1, 'page must be at least 1')
    .optional()
    .default(1),

  /**
   * Number of items per page.
   * Coerced from string → number. Defaults to 20. Max 100.
   */
  limit: z.coerce
    .number({ invalid_type_error: 'limit must be a number' })
    .int('limit must be an integer')
    .min(1, 'limit must be at least 1')
    .max(100, 'limit cannot exceed 100')
    .optional()
    .default(20),

  /**
   * Full-text search query string.
   * Case-insensitive search applied by the service layer.
   */
  q: z.string().trim().optional(),

  /**
   * Column/field name to sort by.
   * The service layer validates this against allowed columns.
   */
  sortBy: z.string().trim().optional(),

  /**
   * Sort direction.
   */
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),

  /**
   * Category filter — single category slug or ID.
   */
  category: z.string().trim().optional(),

  /**
   * Comma-separated list of fields to include in the response.
   * Enables sparse fieldsets (e.g. ?fields=id,email,name).
   * The service/resource layer applies the projection.
   */
  fields: z
    .string()
    .trim()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean)
        : undefined,
    ),
})

/** Inferred TypeScript type for QuerySchema */
export type QueryDto = z.infer<typeof QuerySchema>
