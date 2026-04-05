/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

export interface WranglerOptions {
  appName: string
  hasHyperdrive?: boolean
  hasKV?: boolean
  hasR2?: boolean
  hasQueues?: boolean
  cronJobs?: string[]
}

/**
 * generateWranglerConfig — generates wrangler.jsonc content.
 *
 * Includes optional bindings for Hyperdrive, KV, R2, Queues,
 * and cron triggers based on the provided options.
 */
export function generateWranglerConfig(options: WranglerOptions): string {
  const {
    appName,
    hasHyperdrive = false,
    hasKV = false,
    hasR2 = false,
    hasQueues = false,
    cronJobs = [],
  } = options

  const sections: string[] = []

  if (hasHyperdrive) {
    sections.push(`  // Hyperdrive — accelerated database connections
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<YOUR_HYPERDRIVE_ID>"
    }
  ]`)
  }

  if (hasKV) {
    sections.push(`  // KV Namespace — key-value storage
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "<YOUR_KV_NAMESPACE_ID>",
      "preview_id": "<YOUR_KV_PREVIEW_ID>"
    }
  ]`)
  }

  if (hasR2) {
    sections.push(`  // R2 Bucket — object storage
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "${appName}-storage"
    }
  ]`)
  }

  if (hasQueues) {
    sections.push(`  // Queues — message queuing
  "queues": {
    "producers": [
      {
        "binding": "QUEUE",
        "queue": "${appName}-queue"
      }
    ],
    "consumers": [
      {
        "queue": "${appName}-queue",
        "max_batch_size": 10,
        "max_batch_timeout": 30
      }
    ]
  }`)
  }

  if (cronJobs.length > 0) {
    const triggers = cronJobs.map((cron) => `    { "cron": "${cron}" }`).join(',\n')
    sections.push(`  // Cron triggers
  "triggers": {
    "crons": [
${triggers}
    ]
  }`)
  }

  const bindingsBlock = sections.length > 0 ? `,\n${sections.join(',\n')}` : ''

  return `{
  // ──────────────────────────────────────────────────────────────────
  // 🏢 Bonifade Technologies — wrangler.jsonc
  // ──────────────────────────────────────────────────────────────────
  "name": "${appName}",
  "main": "./dist/server/index.js",
  "compatibility_date": "${new Date().toISOString().slice(0, 10)}",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist/client",
    "binding": "ASSETS"
  },
  "vars": {
    "NODE_ENV": "production"
  }${bindingsBlock}
}
`
}
