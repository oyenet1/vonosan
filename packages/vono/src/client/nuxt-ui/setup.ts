/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { App } from 'vue'

// ─── setupNuxtUI ─────────────────────────────────────────────────────

/**
 * setupNuxtUI — registers the @nuxt/ui Vue plugin on the app instance.
 *
 * Call this in your generated src/main.ts:
 * ```ts
 * import { setupNuxtUI } from 'vono/client'
 * setupNuxtUI(app, { primary: 'blue', neutral: 'zinc' })
 * ```
 *
 * @param app    — Vue app instance
 * @param colors — optional color overrides (primary, neutral)
 */
export async function setupNuxtUI(
  app: App,
  colors?: { primary?: string; neutral?: string },
): Promise<void> {
  try {
    // Dynamic import to avoid hard dependency at build time
    const { ui } = await import('@nuxt/ui/vue-plugin')

    if (colors) {
      // @nuxt/ui reads colors from CSS variables; pass them as plugin options
      app.use(ui, { colors })
    } else {
      app.use(ui)
    }
  } catch {
    // @nuxt/ui not installed — silently skip
    // The user may not have it as a dependency yet
  }
}
