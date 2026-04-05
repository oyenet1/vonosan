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

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

/**
 * Valid Conventional Commits type prefixes.
 * https://www.conventionalcommits.org/en/v1.0.0/
 */
const CONVENTIONAL_TYPES = [
  'feat',
  'fix',
  'chore',
  'docs',
  'refactor',
  'test',
  'style',
  'perf',
  'ci',
  'build',
  'revert',
] as const

/**
 * Matches: <type>[optional scope][optional !]: <description>
 * Examples:
 *   feat: add user auth
 *   fix(auth): handle expired tokens
 *   feat!: breaking change
 *   chore(deps): update packages
 */
const CONVENTIONAL_COMMIT_RE = new RegExp(
  `^(${CONVENTIONAL_TYPES.join('|')})(\\([^)]+\\))?(!)?:\\s.+`,
)

/**
 * Returns `true` when `message` conforms to the Conventional Commits spec.
 */
export function isConventionalCommit(message: string): boolean {
  return CONVENTIONAL_COMMIT_RE.test(message.trim())
}

/**
 * `vono commit "<message>"`
 *
 * Validates the commit message against the Conventional Commits format,
 * then runs `git commit -m "<message>"`.
 */
export async function runCommit(args: string[]): Promise<void> {
  const message = args.join(' ').trim()

  if (!message) {
    process.stderr.write(red('Usage: vono commit "<message>"\n'))
    process.exit(1)
  }

  if (!isConventionalCommit(message)) {
    process.stderr.write(
      red(
        `✖ Commit message does not conform to the Conventional Commits format.\n\n` +
          `  Message: "${message}"\n\n` +
          `  Expected format: <type>[optional scope]: <description>\n\n` +
          `  Valid types: ${CONVENTIONAL_TYPES.join(', ')}\n\n` +
          `  Examples:\n` +
          `    feat: add user authentication\n` +
          `    fix(auth): handle expired JWT tokens\n` +
          `    chore(deps): update drizzle-orm to latest\n` +
          `    feat!: redesign API response format (breaking change)\n`,
      ),
    )
    process.exit(1)
  }

  try {
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' })
    process.stdout.write(`\n${green('✔ Committed:')} ${dim(`"${message}"`)}\n`)
  } catch {
    process.stderr.write(red('git commit failed. Make sure you have staged changes.\n'))
    process.exit(1)
  }
}
