/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { VonoConfig } from '../types/index.js'
import { getResolvedConfig } from './define-config.js'

/**
 * Keys that are safe to expose to the client (no secrets).
 * Server-only keys (JWT_SECRET, DB credentials, etc.) are stripped.
 */
const PUBLIC_CONFIG_KEYS: Array<keyof VonoConfig> = [
  'app',
  'mode',
  'runtime',
  'ui',
  'docs',
]

export type PublicVonoConfig = Pick<VonoConfig, typeof PUBLIC_CONFIG_KEYS[number]>

/**
 * Access the Vono config.
 *
 * On the server: returns the full config.
 * On the client: returns only public-safe keys (no secrets).
 *
 * Usage in Vue components / composables:
 * ```ts
 * const config = useVonoConfig()
 * console.log(config.app.name)
 * ```
 */
export function useVonoConfig(): PublicVonoConfig {
  const full = getResolvedConfig()

  // On the client, only expose public keys
  if (typeof window !== 'undefined') {
    const publicConfig: Partial<VonoConfig> = {}
    for (const key of PUBLIC_CONFIG_KEYS) {
      if (key in full) {
        (publicConfig as Record<string, unknown>)[key] = full[key]
      }
    }
    return publicConfig as PublicVonoConfig
  }

  // On the server, return the full config
  return full as PublicVonoConfig
}
