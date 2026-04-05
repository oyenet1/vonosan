/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

export type StorageDriver = 'r2' | 's3' | 'local'

/**
 * resolveStorageDriver — returns the appropriate storage driver.
 *
 * | Runtime                    | Condition              | Driver |
 * |----------------------------|------------------------|--------|
 * | cloudflare-workers / pages | —                      | r2     |
 * | bun / node                 | AWS creds present      | s3     |
 * | bun / node                 | no AWS creds           | local  |
 *
 * @param runtime — detected runtime string
 * @param env     — environment variables map
 */
export function resolveStorageDriver(
  runtime: string,
  env: Record<string, string>,
): StorageDriver {
  switch (runtime) {
    case 'cloudflare-workers':
    case 'cloudflare-pages':
      return 'r2'

    case 'bun':
    case 'node': {
      const hasAwsCreds =
        Boolean(env['S3_BUCKET']) &&
        Boolean(env['S3_ACCESS_KEY']) &&
        Boolean(env['S3_SECRET_KEY'])
      return hasAwsCreds ? 's3' : 'local'
    }

    default:
      return 'local'
  }
}
