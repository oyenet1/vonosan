/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteRule } from '../../server/route-rules.js'

// Injected by the Vite plugin at build time
declare const __VONO_ROUTE_RULES__: Record<string, RouteRule>

/**
 * Get the route rule for the current page.
 *
 * Usage:
 * ```ts
 * const { mode, cache } = useRouteRules()
 * if (mode.value === 'spa') { ... }
 * ```
 */
export function useRouteRules() {
  const route = useRoute()

  const rule = computed<RouteRule>(() => {
    const rules = typeof __VONO_ROUTE_RULES__ !== 'undefined' ? __VONO_ROUTE_RULES__ : {}
    const path = route.path

    for (const [pattern, r] of Object.entries(rules)) {
      if (pattern === path) return r
      if (pattern.endsWith('/**')) {
        const prefix = pattern.slice(0, -3)
        if (path === prefix || path.startsWith(prefix + '/')) return r
      }
    }

    return { mode: 'ssr' }
  })

  return {
    mode: computed(() => rule.value.mode),
    cache: computed(() => rule.value.cache),
    swr: computed(() => rule.value.swr),
    rule,
  }
}
