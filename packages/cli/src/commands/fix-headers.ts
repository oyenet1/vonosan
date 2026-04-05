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
import fg from 'fast-glob'
import { fixHeaderInFile } from '../header-generator.js'

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

/**
 * `vono fix:headers` — injects missing Bonifade headers into all .ts / .vue
 * files under src/ without touching any other content.
 */
export async function runFixHeaders(args: string[]): Promise<void> {
  const srcDir = join(process.cwd(), args[0] ?? 'src')
  const pattern = join(srcDir, '**/*.{ts,vue}').replace(/\\/g, '/')
  const files = await fg(pattern, { absolute: true, ignore: ['**/node_modules/**', '**/dist/**'] })

  let fixed = 0
  let skipped = 0

  for (const filePath of files) {
    const wasFixed = fixHeaderInFile(filePath)
    if (wasFixed) {
      process.stdout.write(`  ${green('+')} ${filePath}\n`)
      fixed++
    } else {
      skipped++
    }
  }

  process.stdout.write(
    `\n${green(`✔ Fixed ${fixed} file${fixed === 1 ? '' : 's'}.`)} ${dim(`(${skipped} already had headers)`)}\n`,
  )
}
