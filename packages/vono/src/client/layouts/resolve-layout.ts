/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { Component } from 'vue'
import { defineAsyncComponent } from 'vue'

// ─── Layout registry ─────────────────────────────────────────────────

/**
 * Built-in layout names supported by Vono.
 * 'blank' / undefined means no wrapper — render the page directly.
 */
export type LayoutName = 'default' | 'dashboard' | 'auth' | 'blank' | undefined

/**
 * resolveLayout — returns the correct layout component for a given name.
 *
 * - 'default'   → DefaultLayout (slot wrapper)
 * - 'dashboard' → DashboardLayout (sidebar + main)
 * - 'auth'      → AuthLayout (centered card)
 * - 'blank'     → null (no wrapper)
 * - undefined   → null (no wrapper)
 *
 * Usage in a page component:
 * ```vue
 * <script setup>
 * defineOptions({ layout: 'dashboard' })
 * </script>
 * ```
 *
 * Usage in the router view wrapper:
 * ```ts
 * const Layout = resolveLayout(route.meta.layout as LayoutName)
 * ```
 */
export function resolveLayout(layoutName: LayoutName): Component | null {
  switch (layoutName) {
    case 'default':
      return defineAsyncComponent(() => import('./layouts/default.vue'))

    case 'dashboard':
      return defineAsyncComponent(() => import('./layouts/dashboard.vue'))

    case 'auth':
      return defineAsyncComponent(() => import('./layouts/auth.vue'))

    case 'blank':
    case undefined:
    default:
      return null
  }
}
