/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { Hono } from 'hono'

/**
 * Auto-discovers and mounts all *.routes.ts files from src/modules/*/.
 *
 * Each module exports a Hono sub-app as its default export.
 * The route prefix is derived from the module folder name.
 *
 * Convention:
 *   src/modules/auth/auth.routes.ts  → /auth
 *   src/modules/payment/payment.routes.ts  → /payment
 *
 * This function uses import.meta.glob (Vite) for zero-config discovery.
 * No manual route registration is required when adding a new module.
 */
export async function autoRegisterRoutes(app: Hono): Promise<void> {
  // import.meta.glob is resolved at build time by Vite
  const modules = import.meta.glob<{ default: Hono }>(
    '/src/modules/*/*.routes.ts',
    { eager: true },
  )

  for (const [path, mod] of Object.entries(modules)) {
    // Extract module name from path:
    // "/src/modules/auth/auth.routes.ts" → "auth"
    const match = path.match(/\/modules\/([^/]+)\//)
    if (!match) continue

    const prefix = `/${match[1]}`

    if (!mod.default) {
      console.warn(`[vono] autoRegisterRoutes: ${path} has no default export, skipping`)
      continue
    }

    app.route(prefix, mod.default)
  }
}
