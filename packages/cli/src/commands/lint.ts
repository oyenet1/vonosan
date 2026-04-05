/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { join } from 'node:path'
import { lintProject, type LintResult } from '../linter.js'

/** ANSI colour helpers */
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

function formatResults(results: LintResult[]): void {
  if (results.length === 0) {
    process.stdout.write(green('✔ No lint violations found.\n'))
    return
  }

  // Group by file
  const byFile = new Map<string, LintResult[]>()
  for (const r of results) {
    const list = byFile.get(r.file) ?? []
    list.push(r)
    byFile.set(r.file, list)
  }

  for (const [file, violations] of byFile) {
    process.stdout.write(`\n${yellow(file)}\n`)
    for (const v of violations) {
      process.stdout.write(
        `  ${dim(`${v.line}:`)} ${red(`[${v.rule}]`)} ${v.message}\n`,
      )
    }
  }

  process.stdout.write(
    `\n${red(`✖ ${results.length} violation${results.length === 1 ? '' : 's'} found.`)}\n`,
  )
}

/**
 * `vono lint` — scans src/ for all lint violations and prints a report.
 * Exits with code 1 when violations are found.
 */
export async function runLint(args: string[]): Promise<void> {
  const srcDir = join(process.cwd(), args[0] ?? 'src')
  process.stdout.write(`Linting ${srcDir} …\n`)

  const results = await lintProject(srcDir)
  formatResults(results)

  if (results.length > 0) process.exit(1)
}
