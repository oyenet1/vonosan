/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { ref, onServerPrefetch } from 'vue'
import type { Ref } from 'vue'

export interface AsyncDataOptions<T> {
  /** Initial value before data is fetched */
  default?: () => T | null
  /** Whether to skip fetching on the server */
  server?: boolean
  /** Whether to skip fetching on the client (use SSR data only) */
  lazy?: boolean
}

export interface AsyncDataResult<T> {
  data: Ref<T | null>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refresh: () => Promise<void>
}

// SSR payload store — keyed by data key
const ssrPayload: Record<string, unknown> =
  typeof window !== 'undefined'
    ? ((window as unknown as Record<string, unknown>).__VONO_ASYNC_DATA__ as Record<string, unknown>) ?? {}
    : {}

/**
 * Fetch data on the server during SSR, hydrate on the client without
 * a duplicate fetch.
 *
 * Usage:
 * ```ts
 * const { data, pending } = useAsyncData('users', () => fetch('/api/users').then(r => r.json()))
 * ```
 */
export function useAsyncData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: AsyncDataOptions<T> = {},
): AsyncDataResult<T> {
  const data = ref<T | null>(
    (ssrPayload[key] as T | null) ?? options.default?.() ?? null,
  ) as Ref<T | null>
  const pending = ref(false)
  const error = ref<Error | null>(null)

  const fetch = async () => {
    pending.value = true
    error.value = null
    try {
      data.value = await fetcher()
      // Store in SSR payload for client hydration
      if (import.meta.env.SSR) {
        ssrPayload[key] = data.value
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
    } finally {
      pending.value = false
    }
  }

  // On server: fetch during SSR (before renderToString completes)
  if (import.meta.env.SSR && options.server !== false) {
    onServerPrefetch(fetch)
  }

  // On client: only fetch if data wasn't hydrated from SSR
  if (!import.meta.env.SSR && !ssrPayload[key] && !options.lazy) {
    fetch()
  }

  return { data, pending, error, refresh: fetch }
}
