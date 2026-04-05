/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { execSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import fg from 'fast-glob'

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`

function run(cmd: string): void {
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() })
}

// ─── db:push ─────────────────────────────────────────────────────────────────

/**
 * `vono db:push` — pushes the current schema to the database without generating
 * a migration file (useful during development).
 */
export async function runDbPush(_args: string[]): Promise<void> {
  process.stdout.write(bold('Pushing schema to database …\n'))
  run('bunx drizzle-kit push')
  process.stdout.write(green('✔ Schema pushed.\n'))
}

// ─── db:studio ───────────────────────────────────────────────────────────────

/**
 * `vono db:studio` — opens Drizzle Studio in the browser.
 * This is a long-running process; we spawn it without waiting.
 */
export async function runDbStudio(_args: string[]): Promise<void> {
  process.stdout.write(bold('Opening Drizzle Studio …\n'))
  // Use spawnSync so the process inherits the terminal and the user can Ctrl+C
  spawnSync('bunx', ['drizzle-kit', 'studio'], { stdio: 'inherit', cwd: process.cwd() })
}

// ─── db:seed ─────────────────────────────────────────────────────────────────

/**
 * `vono db:seed [name]`
 *
 * Runs seed files from `src/db/seeds/`.
 * - With no argument: runs `src/db/seeds/index.ts`
 * - With a name: runs `src/db/seeds/<name>.ts`
 */
export async function runDbSeed(args: string[]): Promise<void> {
  const [name] = args
  const seedsDir = join(process.cwd(), 'src', 'db', 'seeds')

  if (name) {
    const seedFile = join(seedsDir, `${name}.ts`)
    if (!existsSync(seedFile)) {
      process.stderr.write(red(`Seed file not found: ${seedFile}\n`))
      process.exit(1)
    }
    process.stdout.write(bold(`Running seed "${name}" …\n`))
    run(`bun run ${seedFile}`)
    process.stdout.write(green(`✔ Seed "${name}" complete.\n`))
    return
  }

  // No name — run all seeds via index.ts or discover *.ts files
  const indexFile = join(seedsDir, 'index.ts')
  if (existsSync(indexFile)) {
    process.stdout.write(bold('Running seeds via index.ts …\n'))
    run(`bun run ${indexFile}`)
    process.stdout.write(green('✔ Seeds complete.\n'))
    return
  }

  // Fallback: run all seed files in order
  const pattern = join(seedsDir, '*.ts').replace(/\\/g, '/')
  const seedFiles = await fg(pattern, { absolute: true })

  if (seedFiles.length === 0) {
    process.stdout.write(`No seed files found in ${seedsDir}.\n`)
    return
  }

  for (const seedFile of seedFiles.sort()) {
    process.stdout.write(bold(`Running ${seedFile} …\n`))
    run(`bun run ${seedFile}`)
  }
  process.stdout.write(green(`✔ All seeds complete.\n`))
}
