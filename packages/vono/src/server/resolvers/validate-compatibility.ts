/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { QueueDriver } from './queue-driver.js'
import type { StorageDriver } from './storage-driver.js'
import type { CacheDriver } from './cache-driver.js'

// ─── Incompatibility rules ───────────────────────────────────────────

interface IncompatibilityRule {
  runtime: string[]
  driver: string
  driverType: 'queue' | 'storage' | 'cache'
  reason: string
}

const INCOMPATIBLE: IncompatibilityRule[] = [
  {
    runtime: ['cloudflare-workers', 'cloudflare-pages'],
    driver: 'bullmq',
    driverType: 'queue',
    reason:
      'BullMQ requires Redis and Node.js APIs not available on Cloudflare Workers. ' +
      'Use cloudflare-queues instead.',
  },
  {
    runtime: ['cloudflare-workers', 'cloudflare-pages'],
    driver: 'sqs',
    driverType: 'queue',
    reason:
      'AWS SQS SDK is not compatible with Cloudflare Workers. ' +
      'Use cloudflare-queues instead.',
  },
  {
    runtime: ['cloudflare-workers', 'cloudflare-pages'],
    driver: 's3',
    driverType: 'storage',
    reason:
      'AWS S3 SDK requires Node.js APIs not available on Cloudflare Workers. ' +
      'Use R2 instead.',
  },
  {
    runtime: ['cloudflare-workers', 'cloudflare-pages'],
    driver: 'local',
    driverType: 'storage',
    reason:
      'Local filesystem storage is not available on Cloudflare Workers. ' +
      'Use R2 instead.',
  },
  {
    runtime: ['vercel', 'netlify', 'deno', 'fastly'],
    driver: 'bullmq',
    driverType: 'queue',
    reason:
      'BullMQ requires a persistent Redis connection which is not available on serverless runtimes. ' +
      'Use Upstash QStash instead.',
  },
  {
    runtime: ['vercel', 'netlify', 'deno', 'fastly'],
    driver: 'local',
    driverType: 'storage',
    reason:
      'Local filesystem storage is ephemeral on serverless runtimes. ' +
      'Use S3 or another cloud storage driver.',
  },
]

// ─── validateDriverCompatibility ────────────────────────────────────

/**
 * validateDriverCompatibility — throws a descriptive error for
 * incompatible driver/runtime combinations.
 *
 * Call this at startup before accepting requests.
 *
 * @throws Error with a human-readable message listing all conflicts
 */
export function validateDriverCompatibility(
  runtime: string,
  queueDriver: QueueDriver,
  storageDriver: StorageDriver,
  cacheDriver: CacheDriver,
): void {
  const errors: string[] = []

  for (const rule of INCOMPATIBLE) {
    if (!rule.runtime.includes(runtime)) continue

    const driverValue =
      rule.driverType === 'queue'
        ? queueDriver
        : rule.driverType === 'storage'
          ? storageDriver
          : cacheDriver

    if (driverValue === rule.driver) {
      errors.push(
        `  ❌ [${rule.driverType}] "${rule.driver}" is incompatible with runtime "${runtime}":\n` +
          `     ${rule.reason}`,
      )
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[vono] Driver compatibility errors detected:\n\n${errors.join('\n\n')}\n\n` +
        `Fix these in your vono.config.ts before starting the server.`,
    )
  }
}
