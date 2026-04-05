/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// ─── Types ───────────────────────────────────────────────────────────

interface PackageUpdate {
  name: string
  current: string
  latest: string
  isMajor: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`

/**
 * Fetch the latest version of a package from the npm registry.
 */
async function fetchLatestVersion(packageName: string): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`)
    if (!res.ok) return null
    const data = (await res.json()) as { version: string }
    return data.version
  } catch {
    return null
  }
}

/**
 * Compare semver strings — returns true if latest is a major bump.
 */
function isMajorBump(current: string, latest: string): boolean {
  const clean = (v: string) => v.replace(/^[\^~>=<]/, '')
  const [curMajor] = clean(current).split('.').map(Number)
  const [latMajor] = clean(latest).split('.').map(Number)
  return latMajor > curMajor
}

/**
 * Read package.json from cwd.
 */
function readPackageJson(): Record<string, unknown> {
  const pkgPath = join(process.cwd(), 'package.json')
  if (!existsSync(pkgPath)) {
    throw new Error('No package.json found in current directory.')
  }
  return JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
}

/**
 * Collect all vono-related packages from package.json.
 */
function collectVonoPackages(pkg: Record<string, unknown>): Record<string, string> {
  const deps = {
    ...((pkg.dependencies as Record<string, string>) ?? {}),
    ...((pkg.devDependencies as Record<string, string>) ?? {}),
  }

  const vonoPackages: Record<string, string> = {}

  for (const [name, version] of Object.entries(deps)) {
    if (name === 'vono' || name === '@vono/cli' || name.startsWith('@vono/')) {
      vonoPackages[name] = version
    }
  }

  return vonoPackages
}

// ─── runUpgradeCheck ─────────────────────────────────────────────────

/**
 * vono upgrade --check
 *
 * Reads package.json, checks npm registry for latest versions of
 * vono, @vono/cli, and all installed @vono/* packages.
 */
export async function runUpgradeCheck(_args: string[]): Promise<void> {
  process.stdout.write(bold('Checking for Vono updates...\n\n'))

  let pkg: Record<string, unknown>
  try {
    pkg = readPackageJson()
  } catch (err) {
    process.stderr.write(red(String(err) + '\n'))
    process.exit(1)
  }

  const vonoPackages = collectVonoPackages(pkg)

  if (Object.keys(vonoPackages).length === 0) {
    process.stdout.write('No Vono packages found in package.json.\n')
    return
  }

  const updates: PackageUpdate[] = []

  for (const [name, current] of Object.entries(vonoPackages)) {
    process.stdout.write(`  Checking ${name}...`)
    const latest = await fetchLatestVersion(name)

    if (!latest) {
      process.stdout.write(yellow(` (registry unavailable)\n`))
      continue
    }

    const cleanCurrent = current.replace(/^[\^~>=<]/, '')

    if (cleanCurrent === latest) {
      process.stdout.write(green(` ✔ up to date (${latest})\n`))
    } else {
      const major = isMajorBump(current, latest)
      process.stdout.write(
        major
          ? red(` ↑ ${cleanCurrent} → ${latest} (MAJOR)\n`)
          : yellow(` ↑ ${cleanCurrent} → ${latest}\n`),
      )
      updates.push({ name, current: cleanCurrent, latest, isMajor: major })
    }
  }

  process.stdout.write('\n')

  if (updates.length === 0) {
    process.stdout.write(green('✔ All Vono packages are up to date.\n'))
    return
  }

  process.stdout.write(bold(`${updates.length} update(s) available:\n\n`))

  for (const u of updates) {
    const label = u.isMajor ? red('[MAJOR]') : yellow('[minor]')
    process.stdout.write(`  ${label} ${u.name}: ${u.current} → ${u.latest}\n`)
  }

  const hasMajor = updates.some((u) => u.isMajor)
  if (hasMajor) {
    process.stdout.write(
      `\n${yellow('⚠ Major updates may include breaking changes.')}\n` +
        `  Run ${bold('vono upgrade --apply-codemods')} to apply automated migrations.\n`,
    )
  } else {
    process.stdout.write(
      `\n  Run ${bold('bun update')} (or your package manager) to apply updates.\n`,
    )
  }
}

// ─── runUpgradeApply ─────────────────────────────────────────────────

/**
 * vono upgrade --apply-codemods
 *
 * Runs automated codemods for major version upgrades.
 * Reports what was changed vs what needs manual review.
 */
export async function runUpgradeApply(_args: string[]): Promise<void> {
  process.stdout.write(bold('Applying codemods for major version upgrades...\n\n'))

  // Codemods registry — keyed by package@majorVersion
  const codemods: Array<{
    package: string
    fromMajor: number
    toMajor: number
    description: string
    apply: () => Promise<{ changed: string[]; manual: string[] }>
  }> = [
    // Placeholder for future codemods
    // {
    //   package: 'vono',
    //   fromMajor: 0,
    //   toMajor: 1,
    //   description: 'Migrate defineVonoConfig shape',
    //   apply: async () => ({ changed: [], manual: [] }),
    // },
  ]

  if (codemods.length === 0) {
    process.stdout.write('No codemods available for the current version range.\n')
    process.stdout.write(
      `\n${yellow('Manual steps may still be required.')}\n` +
        `  Check the changelog at https://github.com/oyenet1/vono/releases\n`,
    )
    return
  }

  const changed: string[] = []
  const manual: string[] = []

  for (const codemod of codemods) {
    process.stdout.write(`  Applying: ${codemod.description}...\n`)
    const result = await codemod.apply()
    changed.push(...result.changed)
    manual.push(...result.manual)
  }

  if (changed.length > 0) {
    process.stdout.write(green(`\n✔ Automatically updated:\n`))
    for (const f of changed) process.stdout.write(`  + ${f}\n`)
  }

  if (manual.length > 0) {
    process.stdout.write(yellow(`\n⚠ Requires manual review:\n`))
    for (const f of manual) process.stdout.write(`  ! ${f}\n`)
  }

  process.stdout.write(green('\n✔ Codemods applied.\n'))
}
