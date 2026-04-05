/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { Context } from 'hono'

/**
 * detectLocale — resolves the current locale from the request.
 *
 * Strategies:
 *   'prefix'  — reads the first path segment, e.g. /en/about → 'en'
 *   'cookie'  — reads the `locale` cookie
 *   'header'  — parses the Accept-Language header (first tag only)
 *
 * Falls back to `defaultLocale` when nothing is found.
 */
export function detectLocale(
  c: Context,
  strategy: 'prefix' | 'cookie' | 'header',
  defaultLocale: string,
): string {
  switch (strategy) {
    case 'prefix': {
      const path = new URL(c.req.url).pathname
      const segment = path.split('/').filter(Boolean)[0]
      return segment ?? defaultLocale
    }

    case 'cookie': {
      const cookie = c.req.header('cookie') ?? ''
      const match = cookie.match(/(?:^|;\s*)locale=([^;]+)/)
      return match?.[1] ?? defaultLocale
    }

    case 'header': {
      const acceptLanguage = c.req.header('accept-language') ?? ''
      // e.g. "en-US,en;q=0.9,fr;q=0.8" → "en"
      const first = acceptLanguage.split(',')[0]?.split(';')[0]?.split('-')[0]?.trim()
      return first || defaultLocale
    }

    default:
      return defaultLocale
  }
}
