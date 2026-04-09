/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import fg from 'fast-glob'

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

/** Maps console method names to Logger equivalents */
const METHOD_MAP: Record<string, string> = {
  log: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
  info: 'info',
}

const LOGGER_IMPORT = `import { Logger } from 'vonosan/server'`
const LOGGER_IMPORT_RE = /import\s*\{[^}]*Logger[^}]*\}\s*from\s*['"]vonosan\/server['"]/

/**
 * Replaces all `console.*()` calls in `content` with `Logger.*()` equivalents
 * and ensures the Logger import is present.
 *
 * Returns `null` when no changes were needed.
 */
function fixLogs(content: string): string | null {
  if (content.includes('// @vono-ignore-logs')) return null

  const consoleRe = /\bconsole\.(log|warn|error|debug|info)\s*\(/g
  let changed = false

  const updated = content.replace(consoleRe, (_match, method: string) => {
    changed = true
    const loggerMethod = METHOD_MAP[method] ?? 'info'
    return `Logger.${loggerMethod}(`
  })

  if (!changed) return null

  // Ensure Logger is imported
  if (!LOGGER_IMPORT_RE.test(updated)) {
    // Insert after the last existing import line, or at the top
    const lastImportIdx = [...updated.matchAll(/^import .+$/gm)].pop()
    if (lastImportIdx?.index !== undefined) {
      const insertAt = lastImportIdx.index + lastImportIdx[0].length
      return updated.slice(0, insertAt) + '\n' + LOGGER_IMPORT + updated.slice(insertAt)
    }
    return LOGGER_IMPORT + '\n\n' + updated
  }

  return updated
}

/**
 * `vono fix:logs` — replaces raw `console.*` calls with `Logger.*` equivalents
 * across all .ts files under src/.
 */
export async function runFixLogs(args: string[]): Promise<void> {
  const srcDir = join(process.cwd(), args[0] ?? 'src')
  // Only .ts files — .vue files may have <script> blocks but we keep it simple
  const pattern = join(srcDir, '**/*.ts').replace(/\\/g, '/')
  const files = await fg(pattern, {
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/logger.ts'],
  })

  let fixed = 0
  let skipped = 0

  for (const filePath of files) {
    const original = readFileSync(filePath, 'utf8')
    const updated = fixLogs(original)
    if (updated !== null) {
      writeFileSync(filePath, updated, 'utf8')
      process.stdout.write(`  ${green('~')} ${filePath}\n`)
      fixed++
    } else {
      skipped++
    }
  }

  process.stdout.write(
    `\n${green(`✔ Fixed ${fixed} file${fixed === 1 ? '' : 's'}.`)} ${dim(`(${skipped} already clean)`)}\n`,
  )

  if (fixed > 0) {
    process.stdout.write(
      yellow(`\n⚠  Review the changes — Logger.info() accepts a string message and an optional context object.\n`),
    )
  }
}
