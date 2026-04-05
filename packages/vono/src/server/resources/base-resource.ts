/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/pagination.js'
import { toCamel } from '../../shared/utils/mappers.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResourceCollection<T = Record<string, unknown>> {
  items: T[]
  meta: PaginationMeta
}

// ─── BaseResource ─────────────────────────────────────────────────────────────

/**
 * BaseResource — abstract base class for API resource transformers.
 *
 * Extend this class to define how a model is serialized for API responses.
 * Override `transform(item)` to customize field mapping.
 *
 * @example
 * ```ts
 * export class UserResource extends BaseResource {
 *   static transform(item: Record<string, unknown>) {
 *     return { id: item.id, email: item.email, name: item.username }
 *   }
 * }
 *
 * return c.json(success('Users', UserResource.toCollection(users, total, page, limit)))
 * ```
 */
export abstract class BaseResource {
  /**
   * Override in subclasses to customize field mapping.
   * By default returns the item with snake_case → camelCase conversion.
   */
  protected static transform(item: Record<string, unknown>): Record<string, unknown> {
    return toCamel(item) as Record<string, unknown>
  }

  /**
   * `toResource(item, fields?)` — transforms a single item.
   *
   * @param item   - Raw DB row or plain object
   * @param fields - Optional allowlist of field names to include in the output
   */
  static toResource(
    item: Record<string, unknown>,
    fields?: string[],
  ): Record<string, unknown> {
    const transformed = this.transform(item)

    if (!fields || fields.length === 0) {
      return transformed
    }

    // Apply field selection — only include requested fields
    return fields.reduce<Record<string, unknown>>((acc, field) => {
      if (Object.prototype.hasOwnProperty.call(transformed, field)) {
        acc[field] = transformed[field]
      }
      return acc
    }, {})
  }

  /**
   * `toCollection(items, total, page, limit)` — transforms an array of items
   * and wraps them with standard pagination metadata.
   *
   * @param items  - Array of raw DB rows
   * @param total  - Total count across all pages
   * @param page   - Current page (1-indexed)
   * @param limit  - Items per page
   * @param fields - Optional field allowlist applied to each item
   */
  static toCollection(
    items: Record<string, unknown>[],
    total: number,
    page: number,
    limit: number,
    fields?: string[],
  ): ResourceCollection {
    return {
      items: items.map((item) => this.toResource(item, fields)),
      meta: buildPaginationMeta(page, limit, total),
    }
  }
}
