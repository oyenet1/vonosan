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
import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { glob } from 'glob'

// ─── Helpers ─────────────────────────────────────────────────────────

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`

/**
 * Detect the configured test runner from package.json or vono.config.ts.
 * Defaults to 'bun'.
 */
function detectTestRunner(): 'bun' | 'vitest' | 'jest' {
  const pkgPath = join(process.cwd(), 'package.json')

  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
      const scripts = (pkg.scripts as Record<string, string>) ?? {}
      const testScript = scripts.test ?? ''

      if (testScript.includes('vitest')) return 'vitest'
      if (testScript.includes('jest')) return 'jest'
    } catch {
      // fall through
    }
  }

  return 'bun'
}

/**
 * Build the test command for the given runner.
 */
function buildTestCommand(runner: 'bun' | 'vitest' | 'jest'): { cmd: string; args: string[] } {
  switch (runner) {
    case 'bun':
      return { cmd: 'bun', args: ['test'] }
    case 'vitest':
      return { cmd: 'npx', args: ['vitest', 'run'] }
    case 'jest':
      return { cmd: 'npx', args: ['jest', '--passWithNoTests'] }
  }
}

// ─── runTest ─────────────────────────────────────────────────────────

/**
 * vono test — executes the configured test runner and reports results.
 */
export async function runTest(_args: string[]): Promise<void> {
  const runner = detectTestRunner()
  const { cmd, args } = buildTestCommand(runner)

  process.stdout.write(bold(`Running tests with ${runner}...\n\n`))

  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  if (result.status !== 0) {
    process.stderr.write(red('\n✖ Tests failed.\n'))
    process.exit(result.status ?? 1)
  }

  process.stdout.write(green('\n✔ All tests passed.\n'))
}

// ─── runTestClean ─────────────────────────────────────────────────────

/**
 * vono test:clean — runs tests first, then deletes **\/*.test.ts
 * only if ALL tests pass. Reports error without deleting if any fail.
 */
export async function runTestClean(_args: string[]): Promise<void> {
  const runner = detectTestRunner()
  const { cmd, args } = buildTestCommand(runner)

  process.stdout.write(bold(`Running tests before cleanup (${runner})...\n\n`))

  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  if (result.status !== 0) {
    process.stderr.write(
      red('\n✖ Tests failed — test files will NOT be deleted.\n') +
        yellow('  Fix all failing tests before running test:clean.\n'),
    )
    process.exit(result.status ?? 1)
  }

  process.stdout.write(green('\n✔ All tests passed. Cleaning up test files...\n\n'))

  // Find all test files
  const testFiles = await glob('**/*.test.ts', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true,
  })

  if (testFiles.length === 0) {
    process.stdout.write('No test files found.\n')
    return
  }

  for (const file of testFiles) {
    try {
      unlinkSync(file)
      const rel = file.replace(process.cwd() + '/', '')
      process.stdout.write(green(`  - ${rel}\n`))
    } catch (err) {
      process.stderr.write(red(`  Failed to delete ${file}: ${String(err)}\n`))
    }
  }

  process.stdout.write(green(`\n✔ Deleted ${testFiles.length} test file(s).\n`))
}
