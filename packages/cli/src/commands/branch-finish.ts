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
import { existsSync, readFileSync, rmSync } from 'node:fs'
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

function hasUncommittedChanges(): boolean {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf8' })
    return output.trim().length > 0
  } catch {
    return false
  }
}

function currentBranch(): string {
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
}

/**
 * `vono branch:finish`
 *
 * 1. Checks for uncommitted changes — halts if any.
 * 2. Merges the current feature branch into the recorded parent.
 * 3. Deletes the feature branch.
 * 4. Checks out the parent branch.
 */
export async function runBranchFinish(_args: string[]): Promise<void> {
  const state = readBranchState()

  if (!state) {
    process.stderr.write(
      red('No branch state found. Did you run `vono branch:new <feature-name>` first?\n'),
    )
    process.exit(1)
  }

  const current = currentBranch()

  if (current !== state.feature) {
    process.stderr.write(
      red(
        `Current branch "${current}" does not match the recorded feature branch "${state.feature}".\n` +
          `Check out the feature branch first.\n`,
      ),
    )
    process.exit(1)
  }

  // Guard: uncommitted changes
  if (hasUncommittedChanges()) {
    process.stderr.write(
      red(
        '✖ You have uncommitted changes. Please commit or stash them before running `vono branch:finish`.\n',
      ),
    )
    process.exit(1)
  }

  process.stdout.write(`Merging ${dim(state.feature)} → ${dim(state.parent)} …\n`)

  try {
    execSync(`git checkout ${state.parent}`, { stdio: 'inherit' })
    execSync(`git merge --no-ff ${state.feature} -m "feat: merge ${state.feature} into ${state.parent}"`, {
      stdio: 'inherit',
    })
    execSync(`git branch -d ${state.feature}`, { stdio: 'inherit' })
  } catch {
    process.stderr.write(red('Merge failed. Resolve conflicts and try again.\n'))
    process.exit(1)
  }

  // Clean up branch state file
  rmSync(BRANCH_STATE_PATH, { force: true })

  process.stdout.write(
    `\n${green(`✔ Merged "${state.feature}" into "${state.parent}" and deleted the feature branch.`)}\n`,
  )
}
