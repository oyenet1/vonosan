/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

/**
 * Hydrate Pinia state from the server-injected script tag.
 *
 * Call this in app.ts before mounting the Vue app:
 * ```ts
 * import { hydratePinia } from 'vonosan/client'
 * hydratePinia(pinia)
 * ```
 *
 * Property 11: Pinia state SSR round-trip
 * Serialized on server → injected as JSON → deserialized on client
 * → equivalent state object
 */
export function hydratePinia(pinia: { state: { value: Record<string, unknown> } }): void {
  if (typeof document === 'undefined') return

  const stateEl = document.getElementById('__pinia')
  if (!stateEl?.textContent) return

  try {
    const state = JSON.parse(stateEl.textContent) as Record<string, unknown>
    pinia.state.value = state
  } catch {
    // Malformed state — ignore and let the app fetch fresh data
  }
}

/**
 * Serialize Pinia state for server injection.
 * XSS-safe: escapes < and > to prevent </script> injection.
 *
 * Used internally by the SSR renderer.
 */
export function serializePiniaState(state: Record<string, unknown>): string {
  return JSON.stringify(state)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
}
