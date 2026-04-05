/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnvKeys } from '../linter/env-parity.js'

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`

/**
 * Appends a key to an env file if it does not already exist.
 * Returns `true` when the key was added, `false` when it already existed.
 */
function appendKey(filePath: string, key: string, comment?: string): boolean {
  // Create the file if it doesn't exist
  if (!existsSync(filePath)) writeFileSync(filePath, '', 'utf8')

  const content = readFileSync(filePath, 'utf8')
  const keys = parseEnvKeys(content)

  if (keys.has(key)) return false

  const line = comment ? `${key}= # ${comment}` : `${key}=`
  const separator = content.endsWith('\n') || content === '' ? '' : '\n'
  appendFileSync(filePath, `${separator}${line}\n`, 'utf8')
  return true
}

/**
 * `vono env:add <KEY> [description]`
 *
 * Appends KEY= to .env and KEY= # description to .env.example.
 * Skips silently if the key already exists in either file.
 */
export async function runEnvAdd(args: string[]): Promise<void> {
  const [key, ...descParts] = args
  const description = descParts.join(' ')

  if (!key) {
    process.stderr.write(red('Usage: vono env:add <KEY> [description]\n'))
    process.exit(1)
  }

  // Validate key format
  if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
    process.stderr.write(
      red(`Invalid key "${key}". Environment variable keys must be UPPER_SNAKE_CASE.\n`),
    )
    process.exit(1)
  }

  const root = process.cwd()
  const envPath = join(root, '.env')
  const examplePath = join(root, '.env.example')

  const addedToEnv = appendKey(envPath, key)
  const addedToExample = appendKey(examplePath, key, description || undefined)

  if (!addedToEnv && !addedToExample) {
    process.stdout.write(yellow(`⚠  Key "${key}" already exists in both .env and .env.example — skipping.\n`))
    return
  }

  if (addedToEnv) {
    process.stdout.write(green(`✔ Added ${key}= to .env\n`))
  } else {
    process.stdout.write(yellow(`  Key "${key}" already in .env — skipped.\n`))
  }

  if (addedToExample) {
    process.stdout.write(
      green(`✔ Added ${key}=${description ? ` # ${description}` : ''} to .env.example\n`),
    )
  } else {
    process.stdout.write(yellow(`  Key "${key}" already in .env.example — skipped.\n`))
  }
}
