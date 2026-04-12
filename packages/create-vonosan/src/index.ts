#!/usr/bin/env node

/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { execa } from 'execa'
import { runWizard } from './wizard.js'
import { scaffoldProject } from './scaffold.js'

const CLI_VERSION = '0.2.12'

// ─── Helpers ─────────────────────────────────────────────────────────

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

// ─── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  // Parse project name (first positional arg)
  const initialProjectName = args.find((a) => !a.startsWith('--')) ?? ''

  // Parse flags
  const saasFlag = args.includes('--saas')

  process.stdout.write(bold(`\ncreate-vonosan v${CLI_VERSION}\n\n`))

  // ── Run interactive wizard ────────────────────────────────────────
  const answers = await runWizard(initialProjectName, saasFlag)
  const projectName = answers.projectName

  // ── Scaffold project files ────────────────────────────────────────
  process.stdout.write(`\nScaffolding project "${projectName}"...\n`)

  try {
    scaffoldProject(answers, projectName)
  } catch (err) {
    process.stderr.write(`\x1b[31mError: ${String(err)}\x1b[0m\n`)
    process.exit(1)
  }

  process.stdout.write(green(`✔ Project files created.\n\n`))

  // ── Install dependencies ──────────────────────────────────────────
  const pm = answers.packageManager
  const installCmd = pm === 'bun' ? 'bun install' : `${pm} install`

  process.stdout.write(`Installing dependencies with ${bold(pm)}...\n`)

  try {
    await execa(pm, ['install'], {
      cwd: projectName,
      stdio: 'inherit',
    })
    process.stdout.write(green(`✔ Dependencies installed.\n\n`))
  } catch {
    process.stdout.write(
      `\x1b[33m⚠ Dependency install failed. Run "${installCmd}" manually.\x1b[0m\n\n`,
    )
  }

  // ── Initialize git ────────────────────────────────────────────────
  process.stdout.write(`Initializing git repository...\n`)

  try {
    await execa('git', ['init'], { cwd: projectName, stdio: 'pipe' })
    await execa('git', ['add', '-A'], { cwd: projectName, stdio: 'pipe' })
    await execa('git', ['commit', '-m', 'chore: initial project scaffold'], {
      cwd: projectName,
      stdio: 'pipe',
    })
    process.stdout.write(green(`✔ Git repository initialized.\n\n`))
  } catch {
    process.stdout.write(
      `\x1b[33m⚠ Git init failed. Initialize manually with "git init".\x1b[0m\n\n`,
    )
  }

  // ── Done ──────────────────────────────────────────────────────────
  process.stdout.write(
    [
      green(`✔ ${projectName} is ready!\n`),
      '',
      `  ${dim('Next steps:')}`,
      `  ${bold(`cd ${projectName}`)}`,
      `  ${bold(`${pm === 'bun' ? 'bun' : pm} run dev`)}`,
      '',
    ].join('\n'),
  )
}

main().catch((err) => {
  if (err instanceof Error && err.message === 'Operation cancelled') {
    process.exit(0)
  }

  process.stderr.write(`\x1b[31mFatal: ${String(err)}\x1b[0m\n`)
  process.exit(1)
})
