/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { ref } from 'vue'
import type { Ref } from 'vue'

// SSR state store — shared across the request on server, window on client
const ssrStateStore: Record<string, unknown> = {}

/**
 * Shared state composable with SSR round-trip support.
 *
 * - On server: stores state in the SSR payload (serialized as window.__VONO_STATE__)
 * - On client: restores state from window.__VONO_STATE__ on hydration
 *
 * Property 12: useState SSR round-trip
 *
 * Usage:
 * ```ts
 * const count = useState('counter', () => 0)
 * count.value++ // reactive, SSR-safe
 * ```
 */
export function useState<T>(key: string, init?: () => T): Ref<T | undefined> {
  // On client: try to restore from SSR payload first
  if (typeof window !== 'undefined') {
    const windowState = (window as unknown as Record<string, unknown>).__VONO_STATE__ as
      | Record<string, unknown>
      | undefined

    if (windowState?.[key] !== undefined) {
      const restored = ref<T | undefined>(windowState[key] as T)
      // Remove from window state after hydration to free memory
      delete windowState[key]
      return restored
    }
  }

  // Check SSR store
  if (ssrStateStore[key] !== undefined) {
    return ref<T | undefined>(ssrStateStore[key] as T)
  }

  // Initialize with provided factory or undefined
  const value = init ? init() : undefined
  ssrStateStore[key] = value

  const state = ref<T | undefined>(value)

  // Keep SSR store in sync
  return new Proxy(state, {
    set(target, prop, newValue) {
      if (prop === 'value') {
        ssrStateStore[key] = newValue
      }
      return Reflect.set(target, prop, newValue)
    },
  })
}

/**
 * Serialize all useState values for injection into the HTML.
 * Called by the SSR renderer to produce window.__VONO_STATE__.
 */
export function serializeVonoState(): string {
  return JSON.stringify(ssrStateStore)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
}

/**
 * Clear the SSR state store between requests (server-side only).
 */
export function clearVonoState(): void {
  for (const key of Object.keys(ssrStateStore)) {
    delete ssrStateStore[key]
  }
}
