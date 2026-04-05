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

export interface CookieOptions {
  maxAge?: number
  expires?: Date
  path?: string
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

/**
 * SSR-safe cookie read/write composable.
 *
 * - On server: reads from the SSR context (injected via provide/inject)
 * - On client: reads/writes document.cookie
 *
 * Usage:
 * ```ts
 * const token = useCookie('auth_token')
 * token.value = 'new-token' // sets cookie
 * ```
 */
export function useCookie(name: string, options: CookieOptions = {}): Ref<string | null> {
  const getValue = (): string | null => {
    if (typeof document === 'undefined') {
      // SSR: cookies are not directly accessible here
      // The app should inject cookies via provide/inject from the Hono context
      return null
    }
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : null
  }

  const cookie = ref<string | null>(getValue())

  // Override the setter to write to document.cookie on the client
  return new Proxy(cookie, {
    set(target, prop, value) {
      if (prop === 'value') {
        target.value = value as string | null

        if (typeof document !== 'undefined' && value !== null) {
          let cookieStr = `${name}=${encodeURIComponent(value as string)}`
          if (options.maxAge !== undefined) cookieStr += `; max-age=${options.maxAge}`
          if (options.expires) cookieStr += `; expires=${options.expires.toUTCString()}`
          if (options.path) cookieStr += `; path=${options.path}`
          if (options.domain) cookieStr += `; domain=${options.domain}`
          if (options.secure) cookieStr += '; secure'
          if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`
          document.cookie = cookieStr
        }
        return true
      }
      return Reflect.set(target, prop, value)
    },
  })
}
