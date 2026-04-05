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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

const BRANCH_STATE_PATH = join(process.cwd(), '.vono', 'branch-state.json')

interface BranchState {
  parent: string
  feature: string
  createdAt: string
}

function readBranchState(): BranchState | null {
  if (!existsSync(BRANCH_STATE_PATH)) return null
  try {
    return JSON.parse(readFileSync(BRANCH_STATE_PATH, 'utf8')) as BranchState
  } catch {
    return null
  }
}

function writeBranchState(state: BranchState): void {
  const dir = join(process.cwd(), '.vono')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(BRANCH_STATE_PATH, JSON.stringify(state, null, 2), 'utf8')
}

function currentBranch(): string {
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
}

/**
 * `vono branch:new <feature-name>`
 *
 * Records the current branch as parent in .vono/branch-state.json,
 * then creates and checks out feature/<feature-name>.
 */
export async function runBranchNew(args: string[]): Promise<void> {
  const [featureName] = args

  if (!featureName) {
    process.stderr.write(red('Usage: vono branch:new <feature-name>\n'))
    process.exit(1)
  }

  // Validate feature name (no spaces, no slashes)
  if (!/^[a-zA-Z0-9_-]+$/.test(featureName)) {
    process.stderr.write(
      red(`Invalid feature name "${featureName}". Use only letters, numbers, hyphens, and underscores.\n`),
    )
    process.exit(1)
  }

  const parent = currentBranch()
  const branchName = `feature/${featureName}`

  // Warn if there's already an active branch state
  const existing = readBranchState()
  if (existing) {
    process.stdout.write(
      `\x1b[33m⚠  Overwriting existing branch state (was on feature "${existing.feature}").\x1b[0m\n`,
    )
  }

  writeBranchState({ parent, feature: branchName, createdAt: new Date().toISOString() })

  try {
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' })
  } catch {
    process.stderr.write(red(`Failed to create branch "${branchName}". Does it already exist?\n`))
    process.exit(1)
  }

  process.stdout.write(
    `\n${green(`✔ Created and checked out branch "${branchName}".`)} ${dim(`(parent: ${parent})`)}\n`,
  )
}
