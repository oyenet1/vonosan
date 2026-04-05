/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StorageUrlConfig {
  /** Storage driver — determines URL resolution strategy */
  driver?: 'local' | 'r2' | 's3' | 'cloudinary' | 'bunny'
  /** Base URL for CDN drivers (e.g. https://cdn.example.com) */
  baseUrl?: string
}

// ─── resolveStorageUrl ────────────────────────────────────────────────────────

/**
 * `resolveStorageUrl(path, config?)` — converts a stored file path to a full
 * public URL based on the configured storage driver.
 *
 * | Driver     | Result                                  |
 * |------------|-----------------------------------------|
 * | local      | `/uploads/<path>`                       |
 * | r2         | `<baseUrl>/<path>`                      |
 * | s3         | `<baseUrl>/<path>`                      |
 * | cloudinary | `<baseUrl>/<path>`                      |
 * | bunny      | `<baseUrl>/<path>`                      |
 *
 * @example
 * resolveStorageUrl('avatars/user-123.jpg', { driver: 'r2', baseUrl: 'https://cdn.example.com' })
 * // → 'https://cdn.example.com/avatars/user-123.jpg'
 *
 * resolveStorageUrl('avatars/user-123.jpg')
 * // → '/uploads/avatars/user-123.jpg'
 */
export function resolveStorageUrl(path: string, config?: StorageUrlConfig): string {
  const driver = config?.driver ?? 'local'
  const baseUrl = config?.baseUrl ?? ''

  // Normalise path — strip leading slash to avoid double slashes
  const normalised = path.startsWith('/') ? path.slice(1) : path

  switch (driver) {
    case 'local':
      return `/uploads/${normalised}`

    case 'r2':
    case 's3':
    case 'cloudinary':
    case 'bunny': {
      if (!baseUrl) {
        // Fallback to local-style path when no baseUrl is configured
        return `/uploads/${normalised}`
      }
      const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
      return `${base}/${normalised}`
    }

    default:
      return `/uploads/${normalised}`
  }
}
