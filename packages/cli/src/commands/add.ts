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
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { join } from 'node:path'
import { Logger } from 'vono/server'

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`

/** Known installable Vono modules */
const KNOWN_MODULES: Record<string, string> = {
  auth: '@vono/auth',
  notifications: '@vono/notifications',
  logging: '@vono/logging',
  ws: '@vono/ws',
  storage: '@vono/storage',
  queue: '@vono/queue',
  cache: '@vono/cache',
  email: '@vono/email',
  i18n: '@vono/i18n',
}

function run(cmd: string): void {
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() })
}

/**
 * Reads vono.config.ts and appends the module to the `modules` array.
 * This is a best-effort text manipulation — for a production implementation
 * you would use an AST transformer.
 */
function updateVonoConfig(packageName: string): void {
  const configPath = join(process.cwd(), 'vono.config.ts')
  if (!existsSync(configPath)) return

  const content = readFileSync(configPath, 'utf8')

  // Idempotency check
  if (content.includes(packageName)) {
    process.stdout.write(yellow(`  vono.config.ts already references "${packageName}" — skipping.\n`))
    return
  }

  // Append to modules array if present, otherwise add a comment
  const updated = content.replace(
    /modules\s*:\s*\[([^\]]*)\]/,
    (match, inner) => `modules: [${inner.trim() ? inner + ',\n    ' : '\n    '}// ${packageName} — configure here\n  ]`,
  )

  if (updated !== content) {
    writeFileSync(configPath, updated, 'utf8')
    process.stdout.write(green(`  Updated vono.config.ts\n`))
  }
}

/**
 * `vono add <module> [--eject]`
 *
 * - Installs the @vono/<module> package
 * - Generates required files
 * - Updates vono.config.ts (idempotent)
 *
 * With `--eject`: copies module source into src/modules/<module>/ and
 * removes the package dependency.
 */
export async function runAdd(args: string[]): Promise<void> {
  const eject = args.includes('--eject')
  const moduleArgs = args.filter(a => !a.startsWith('--'))
  const [moduleName, ...extra] = moduleArgs

  if (!moduleName) {
    process.stderr.write(red('Usage: vono add <module> [--eject]\n'))
    process.stderr.write(`  Known modules: ${Object.keys(KNOWN_MODULES).join(', ')}\n`)
    process.exit(1)
  }

  const packageName = KNOWN_MODULES[moduleName] ?? `@vono/${moduleName}`

  process.stdout.write(bold(`Adding module "${moduleName}" (${packageName}) …\n`))

  if (eject) {
    await ejectModule(moduleName, packageName)
    return
  }

  // Install package
  try {
    run(`bun add ${packageName}`)
    process.stdout.write(green(`✔ Installed ${packageName}\n`))
  } catch {
    process.stderr.write(
      yellow(`⚠  Could not install ${packageName} — it may not be published yet.\n`),
    )
  }

  // Update vono.config.ts
  updateVonoConfig(packageName)

  process.stdout.write(
    green(`\n✔ Module "${moduleName}" added. Configure it in vono.config.ts.\n`),
  )
}

/**
 * Ejects a module: copies its source into src/modules/<module>/ and removes
 * the package dependency.
 */
async function ejectModule(moduleName: string, packageName: string): Promise<void> {
  const nodeModulesPath = join(process.cwd(), 'node_modules', packageName, 'src')
  const targetDir = join(process.cwd(), 'src', 'modules', moduleName)

  if (existsSync(targetDir)) {
    process.stderr.write(
      red(`Module source already ejected at ${targetDir}. Remove it first.\n`),
    )
    process.exit(1)
  }

  if (!existsSync(nodeModulesPath)) {
    process.stderr.write(
      red(
        `Cannot eject: ${packageName} is not installed or has no src/ directory.\n` +
          `Run \`vono add ${moduleName}\` first.\n`,
      ),
    )
    process.exit(1)
  }

  mkdirSync(targetDir, { recursive: true })
  cpSync(nodeModulesPath, targetDir, { recursive: true })
  process.stdout.write(green(`✔ Ejected ${packageName} source to ${targetDir}\n`))

  // Remove the package dependency
  try {
    run(`bun remove ${packageName}`)
    process.stdout.write(green(`✔ Removed ${packageName} from dependencies\n`))
  } catch {
    process.stdout.write(yellow(`⚠  Could not remove ${packageName} — remove it manually.\n`))
  }

  // Update vono.config.ts to remove the package reference
  const configPath = join(process.cwd(), 'vono.config.ts')
  if (existsSync(configPath)) {
    const content = readFileSync(configPath, 'utf8')
    const updated = content.replace(new RegExp(`import.*from.*${packageName}.*\\n`, 'g'), '')
    if (updated !== content) writeFileSync(configPath, updated, 'utf8')
  }

  process.stdout.write(
    green(`\n✔ Module "${moduleName}" ejected to src/modules/${moduleName}/\n`),
  )
}
