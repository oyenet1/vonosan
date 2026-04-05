/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

export type CacheDriver = 'kv' | 'upstash'

/**
 * resolveCacheDriver — returns the appropriate cache driver.
 *
 * | Runtime                    | Driver  |
 * |----------------------------|---------|
 * | cloudflare-workers / pages | kv      |
 * | everything else            | upstash |
 *
 * @param runtime — detected runtime string
 */
export function resolveCacheDriver(runtime: string): CacheDriver {
  switch (runtime) {
    case 'cloudflare-workers':
    case 'cloudflare-pages':
      return 'kv'

    default:
      return 'upstash'
  }
}
