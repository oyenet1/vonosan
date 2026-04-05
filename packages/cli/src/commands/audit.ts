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
import { runFixHeaders } from './fix-headers.js'
import { runFixLogs } from './fix-logs.js'

const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

/** Rules that can be auto-fixed */
const AUTO_FIXABLE: LintResult['rule'][] = ['header-missing', 'console-log']

function printReport(results: LintResult[]): void {
  if (results.length === 0) return

  // Group by rule category
  const byRule = new Map<string, LintResult[]>()
  for (const r of results) {
    const list = byRule.get(r.rule) ?? []
    list.push(r)
    byRule.set(r.rule, list)
  }

  for (const [rule, violations] of byRule) {
    process.stdout.write(`\n${bold(yellow(`[${rule}]`))} — ${violations.length} violation${violations.length === 1 ? '' : 's'}\n`)
    for (const v of violations) {
      process.stdout.write(`  ${dim(v.file + ':' + v.line)}  ${v.message}\n`)
    }
  }
}

/**
 * `vono audit [--fix]`
 *
 * Scans all files under src/ and reports violations.
 * With `--fix`, auto-resolves header and console-log violations.
 * Exits 0 when clean, 1 when violations remain.
 */
export async function runAudit(args: string[]): Promise<void> {
  const fix = args.includes('--fix')
  const srcDir = join(process.cwd(), 'src')

  process.stdout.write(`${bold('Vono Audit')} — scanning ${srcDir} …\n`)

  if (fix) {
    process.stdout.write('\nAuto-fixing headers …\n')
    await runFixHeaders([])
    process.stdout.write('\nAuto-fixing console logs …\n')
    await runFixLogs([])
  }

  const results = await lintProject(srcDir)

  if (results.length === 0) {
    process.stdout.write(green('\n✔ Audit passed — no violations found.\n'))
    process.exit(0)
  }

  printReport(results)

  const autoFixable = results.filter(r => AUTO_FIXABLE.includes(r.rule))
  const manual = results.filter(r => !AUTO_FIXABLE.includes(r.rule))

  process.stdout.write(`\n${red(`✖ ${results.length} violation${results.length === 1 ? '' : 's'} found.`)}`)

  if (!fix && autoFixable.length > 0) {
    process.stdout.write(
      `\n${yellow(`  ${autoFixable.length} can be auto-fixed — run \`vono audit --fix\` to resolve them.`)}`,
    )
  }

  if (manual.length > 0) {
    process.stdout.write(
      `\n${yellow(`  ${manual.length} require${manual.length === 1 ? 's' : ''} manual intervention.`)}`,
    )
  }

  process.stdout.write('\n')
  process.exit(1)
}
