/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

export interface NavigateToOptions {
  /** Replace current history entry instead of pushing */
  replace?: boolean
  /** Navigate to an external URL (opens in same tab) */
  external?: boolean
  /** HTTP redirect code for SSR redirects (default: 302) */
  redirectCode?: number
}

// SSR redirect context — set by the Hono handler before rendering
let _ssrRedirect: ((url: string, code: number) => void) | null = null

/**
 * Set the SSR redirect handler. Called by the Hono renderer before
 * rendering a page so that navigateTo() can trigger a server redirect.
 */
export function setSSRRedirectHandler(handler: (url: string, code: number) => void): void {
  _ssrRedirect = handler
}

/**
 * Programmatic navigation — SSR-safe.
 *
 * - On server: triggers a 302 (or custom code) HTTP redirect
 * - On client: uses Vue Router for SPA navigation
 *
 * Usage:
 * ```ts
 * await navigateTo('/dashboard')
 * await navigateTo('/login', { replace: true })
 * await navigateTo('https://example.com', { external: true })
 * ```
 */
export async function navigateTo(
  path: string,
  options: NavigateToOptions = {},
): Promise<void> {
  const { replace = false, external = false, redirectCode = 302 } = options

  // SSR: trigger server-side redirect
  if (import.meta.env.SSR) {
    if (_ssrRedirect) {
      _ssrRedirect(path, redirectCode)
    }
    return
  }

  // Client: use Vue Router
  if (external) {
    window.location.href = path
    return
  }

  // Dynamic import to avoid bundling vue-router in SSR context
  const { useRouter } = await import('vue-router')
  const router = useRouter()

  if (replace) {
    await router.replace(path)
  } else {
    await router.push(path)
  }
}
