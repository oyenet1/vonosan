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
 * Typed fetch wrapper that handles SSR/client URL differences.
 *
 * - On server: uses relative URLs (same process)
 * - On client: uses absolute URLs (cross-origin safe)
 *
 * Usage:
 * ```ts
 * const users = await useVonoFetch<User[]>('/api/v1/users')
 * ```
 */
export async function useVonoFetch<T = unknown>(
  url: string,
  options: RequestInit & { baseUrl?: string } = {},
): Promise<T> {
  const { baseUrl, ...fetchOptions } = options

  // Resolve the full URL
  let fullUrl: string
  if (url.startsWith('http://') || url.startsWith('https://')) {
    fullUrl = url
  } else if (import.meta.env.SSR) {
    // On server: use the configured base URL or localhost
    const base = baseUrl ?? process.env.APP_URL ?? 'http://localhost:4000'
    fullUrl = `${base}${url}`
  } else {
    // On client: relative URL works fine
    fullUrl = url
  }

  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  })

  if (!response.ok) {
    throw new Error(`[vono] useVonoFetch: ${response.status} ${response.statusText} — ${url}`)
  }

  return response.json() as Promise<T>
}
