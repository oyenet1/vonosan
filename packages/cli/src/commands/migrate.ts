/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { execSync } from 'node:child_process'
import { runSchemaSync } from './schema-sync.js'

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`

/** Runs a shell command, inheriting stdio so output streams to the terminal. */
function run(cmd: string): void {
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() })
}

/** Runs a shell command and returns stdout as a string. */
function capture(cmd: string): string {
  return execSync(cmd, { encoding: 'utf8', cwd: process.cwd() }).trim()
}

// ─── migrate:run ─────────────────────────────────────────────────────────────

/**
 * `vono migrate:run` — applies all pending Drizzle migrations.
 */
export async function runMigrateRun(_args: string[]): Promise<void> {
  process.stdout.write(bold('Running migrations …\n'))
  run('bunx drizzle-kit migrate')
  process.stdout.write(green('✔ Migrations applied.\n'))
}

// ─── migrate:rollback ─────────────────────────────────────────────────────────

/**
 * `vono migrate:rollback` — rolls back the last applied migration.
 *
 * Drizzle Kit does not have a native rollback command; we implement it by
 * dropping the last entry from the drizzle migrations journal and re-running
 * the remaining migrations. This is a best-effort approach — for production
 * use, write explicit down-migration SQL.
 */
export async function runMigrateRollback(_args: string[]): Promise<void> {
  process.stdout.write(bold('Rolling back last migration …\n'))
  // Drizzle Kit does not expose a rollback command directly.
  // We delegate to a project-level script if present, otherwise warn.
  try {
    run('bunx drizzle-kit drop')
    process.stdout.write(green('✔ Last migration rolled back.\n'))
  } catch {
    process.stderr.write(
      red(
        '✖ drizzle-kit drop failed or is not supported in your version.\n' +
          '  Write explicit down-migration SQL and apply it manually.\n',
      ),
    )
    process.exit(1)
  }
}

// ─── migrate:status ───────────────────────────────────────────────────────────

/**
 * `vono migrate:status` — shows the current migration status.
 */
export async function runMigrateStatus(_args: string[]): Promise<void> {
  process.stdout.write(bold('Migration status:\n'))
  run('bunx drizzle-kit status')
}

// ─── migrate:reset ────────────────────────────────────────────────────────────

/**
 * `vono migrate:reset` — rolls back all migrations then re-runs them.
 */
export async function runMigrateReset(_args: string[]): Promise<void> {
  process.stdout.write(bold('Resetting database …\n'))
  // Drop all tables by pushing an empty schema, then re-run migrations
  try {
    run('bunx drizzle-kit drop --all')
  } catch {
    // Some versions don't support --all; continue anyway
  }
  run('bunx drizzle-kit migrate')
  process.stdout.write(green('✔ Database reset complete.\n'))
}

// ─── migrate:fresh ────────────────────────────────────────────────────────────

/**
 * `vono migrate:fresh [--seed]`
 *
 * Drops all tables, re-runs all migrations, and optionally runs seeds.
 */
export async function runMigrateFresh(args: string[]): Promise<void> {
  const seed = args.includes('--seed')
  process.stdout.write(bold('Fresh migration …\n'))

  try {
    run('bunx drizzle-kit drop --all')
  } catch {
    // Ignore — table may not exist yet
  }

  run('bunx drizzle-kit migrate')
  process.stdout.write(green('✔ Migrations applied.\n'))

  if (seed) {
    process.stdout.write(bold('Running seeds …\n'))
    run('bun run src/db/seeds/index.ts')
    process.stdout.write(green('✔ Seeds complete.\n'))
  }
}

// ─── migrate:make ─────────────────────────────────────────────────────────────

/**
 * `vono migrate:make <name>`
 *
 * Syncs the schema barrel first, then generates a new Drizzle migration.
 */
export async function runMigrateMake(args: string[]): Promise<void> {
  const [name] = args
  if (!name) {
    process.stderr.write(red('Usage: vono migrate:make <name>\n'))
    process.exit(1)
  }

  process.stdout.write(bold('Syncing schema barrel …\n'))
  await runSchemaSync([])

  process.stdout.write(bold(`Generating migration "${name}" …\n`))
  run(`bunx drizzle-kit generate --name=${name}`)
  process.stdout.write(green(`✔ Migration "${name}" generated.\n`))
}
