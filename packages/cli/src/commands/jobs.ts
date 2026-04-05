/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import fg from 'fast-glob'

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`

// ─── jobs:run ─────────────────────────────────────────────────────────────────

/**
 * `vono jobs:run <name>` — executes a named cron job immediately.
 *
 * Discovers job files from `src/jobs/*.job.ts` and `src/modules/**\/*.job.ts`,
 * then calls `runJobNow(name, jobs, db, config)`.
 */
export async function runJobsRun(args: string[]): Promise<void> {
  const [name] = args

  if (!name) {
    process.stderr.write(red('Usage: vono jobs:run <name>\n'))
    process.exit(1)
  }

  process.stdout.write(bold(`Running job "${name}" …\n`))

  // Discover job files
  const patterns = [
    join(process.cwd(), 'src', 'jobs', '*.job.ts').replace(/\\/g, '/'),
    join(process.cwd(), 'src', 'modules', '**', '*.job.ts').replace(/\\/g, '/'),
  ]

  const jobFiles = await fg(patterns, { absolute: true })

  if (jobFiles.length === 0) {
    process.stderr.write(red('No job files found in src/jobs/ or src/modules/\n'))
    process.exit(1)
  }

  // Load all job definitions
  const jobs: Array<{ name: string; handler: (ctx: unknown) => Promise<void> }> = []

  for (const file of jobFiles) {
    try {
      const mod = await import(file) as Record<string, unknown>
      for (const exported of Object.values(mod)) {
        if (
          exported &&
          typeof exported === 'object' &&
          'name' in exported &&
          'handler' in exported &&
          typeof (exported as { handler: unknown }).handler === 'function'
        ) {
          jobs.push(exported as { name: string; handler: (ctx: unknown) => Promise<void> })
        }
      }
    } catch (err) {
      process.stderr.write(red(`Failed to load job file: ${file}\n${String(err)}\n`))
    }
  }

  const job = jobs.find((j) => j.name === name)

  if (!job) {
    const available = jobs.map((j) => j.name).join(', ')
    process.stderr.write(red(`Job "${name}" not found.\n`))
    if (available) {
      process.stdout.write(`Available jobs: ${available}\n`)
    }
    process.exit(1)
  }

  // Load DB and config from the project's entry point
  const envPath = join(process.cwd(), '.env')
  if (existsSync(envPath)) {
    // Load .env manually for CLI context
    const { readFileSync } = await import('node:fs')
    const envContent = readFileSync(envPath, 'utf8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  }

  // Minimal context for job execution
  const ctx = {
    db: null, // Jobs that need DB should handle null gracefully in CLI context
    config: process.env as unknown,
    logger: {
      info: (msg: string, ctx?: unknown) => process.stdout.write(`[info] ${msg} ${ctx ? JSON.stringify(ctx) : ''}\n`),
      warn: (msg: string, ctx?: unknown) => process.stdout.write(`[warn] ${msg} ${ctx ? JSON.stringify(ctx) : ''}\n`),
      error: (msg: string, ctx?: unknown) => process.stderr.write(`[error] ${msg} ${ctx ? JSON.stringify(ctx) : ''}\n`),
      debug: (msg: string, ctx?: unknown) => process.stdout.write(`[debug] ${msg} ${ctx ? JSON.stringify(ctx) : ''}\n`),
    },
  }

  try {
    await job.handler(ctx)
    process.stdout.write(green(`✔ Job "${name}" completed.\n`))
  } catch (err) {
    process.stderr.write(red(`✗ Job "${name}" failed: ${String(err)}\n`))
    process.exit(1)
  }
}
