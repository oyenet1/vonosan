/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

export type RenderMode = 'ssr' | 'spa' | 'prerender'

export interface RouteRule {
  /** How this route renders */
  mode: RenderMode
  /** Cache-Control max-age in seconds. Only for SSR/prerender. */
  cache?: number
  /** Stale-while-revalidate: serve stale while revalidating in background */
  swr?: boolean
}

export type RouteRules = Record<string, RouteRule>

/** Default rule returned when no pattern matches — SSR by default */
export const defaultRule: RouteRule = { mode: 'ssr' }

/**
 * Match a URL path against a single pattern.
 *
 * Supports:
 * - Exact match: '/about' matches '/about' only
 * - Wildcard suffix: '/blog/**' matches '/blog', '/blog/post', '/blog/2024/foo'
 */
export function matchPattern(pattern: string, path: string): boolean {
  // Exact match
  if (pattern === path) return true

  // Wildcard: '/blog/**' matches '/blog/anything'
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3) // strip '/**'
    return path === prefix || path.startsWith(prefix + '/')
  }

  return false
}

/**
 * Resolve the route rule for a given URL path.
 *
 * Patterns are matched top-to-bottom — first match wins.
 * Returns defaultRule if no pattern matches.
 *
 * Property 9: returns defaultRule for unmatched paths
 * Property 10: first-match semantics
 */
export function resolveRouteRule(
  path: string,
  routeRules: RouteRules,
): RouteRule {
  for (const [pattern, rule] of Object.entries(routeRules)) {
    if (matchPattern(pattern, path)) return rule
  }
  return defaultRule
}

/**
 * Default route rules for a new Vono project.
 * Public pages → SSR, app pages → SPA.
 */
export const defaultRouteRules: RouteRules = {
  // Public pages: SSR for SEO
  '/': { mode: 'ssr', cache: 3600 },
  '/about': { mode: 'ssr', cache: 86400 },
  '/pricing': { mode: 'ssr', cache: 3600 },
  '/blog': { mode: 'ssr', cache: 600, swr: true },
  '/blog/**': { mode: 'ssr', cache: 1800, swr: true },
  '/contact': { mode: 'ssr', cache: 86400 },
  '/terms': { mode: 'ssr', cache: 86400 },
  '/privacy': { mode: 'ssr', cache: 86400 },

  // App pages: SPA only (behind auth, no SEO needed)
  '/dashboard/**': { mode: 'spa' },
  '/admin/**': { mode: 'spa' },
  '/settings/**': { mode: 'spa' },
  '/onboarding/**': { mode: 'spa' },
}
