/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

export interface PaginationMeta {
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

/**
 * Build a standard pagination meta object.
 *
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @param total - Total number of items across all pages
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const total_pages = limit > 0 ? Math.ceil(total / limit) : 0
  return {
    page,
    page_size: limit,
    total_items: total,
    total_pages,
    has_next: page < total_pages,
    has_prev: page > 1,
  }
}
