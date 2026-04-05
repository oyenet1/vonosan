/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

export type QueueDriver = 'bullmq' | 'cloudflare-queues' | 'sqs' | 'upstash'

/**
 * resolveQueueDriver — returns the appropriate queue driver for the runtime.
 *
 * | Runtime                          | Driver             |
 * |----------------------------------|--------------------|
 * | bun / node                       | bullmq             |
 * | cloudflare-workers / pages       | cloudflare-queues  |
 * | aws-lambda                       | sqs                |
 * | vercel / netlify / deno / fastly | upstash            |
 *
 * @param runtime  — detected runtime string
 * @param explicit — optional override from vono.config.ts
 */
export function resolveQueueDriver(runtime: string, explicit?: string): QueueDriver {
  if (explicit) return explicit as QueueDriver

  switch (runtime) {
    case 'bun':
    case 'node':
      return 'bullmq'

    case 'cloudflare-workers':
    case 'cloudflare-pages':
      return 'cloudflare-queues'

    case 'aws-lambda':
      return 'sqs'

    case 'vercel':
    case 'netlify':
    case 'deno':
    case 'fastly':
      return 'upstash'

    default:
      return 'bullmq'
  }
}
