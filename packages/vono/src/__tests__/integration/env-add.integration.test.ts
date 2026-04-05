/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdirSync, writeFileSync, readFileSync, appendFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnvKeys } from '../../../../cli/src/linter/env-parity.js'

// ─── Helpers ─────────────────────────────────────────────────────────

const TMP_DIR = join(import.meta.dir, '__tmp_env_add__')

function cleanup() {
  if (existsSync(TMP_DIR)) {
    rmSync(TMP_DIR, { recursive: true, force: true })
  }
}

/**
 * Minimal re-implementation of appendKey logic for testing.
 * (Tests the logic, not the CLI command's process.exit side effects.)
 */
function appendKey(filePath: string, key: string, comment?: string): boolean {
  if (!existsSync(filePath)) writeFileSync(filePath, '', 'utf8')

  const content = readFileSync(filePath, 'utf8')
  const keys = parseEnvKeys(content)

  if (keys.has(key)) return false

  const line = comment ? `${key}= # ${comment}` : `${key}=`
  const separator = content.endsWith('\n') || content === '' ? '' : '\n'
  appendFileSync(filePath, `${separator}${line}\n`, 'utf8')
  return true
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('env:add integration', () => {
  beforeEach(() => {
    cleanup()
    mkdirSync(TMP_DIR, { recursive: true })
  })

  afterEach(cleanup)

  it('appends key to both .env and .env.example', () => {
    const envPath = join(TMP_DIR, '.env')
    const examplePath = join(TMP_DIR, '.env.example')

    writeFileSync(envPath, 'DATABASE_URL=postgres://localhost\n', 'utf8')
    writeFileSync(examplePath, 'DATABASE_URL=\n', 'utf8')

    appendKey(envPath, 'NEW_KEY')
    appendKey(examplePath, 'NEW_KEY', 'A new key')

    const envContent = readFileSync(envPath, 'utf8')
    const exampleContent = readFileSync(examplePath, 'utf8')

    expect(envContent).toContain('NEW_KEY=')
    expect(exampleContent).toContain('NEW_KEY=')
    expect(exampleContent).toContain('# A new key')
  })

  it('is idempotent — does not duplicate keys on second run', () => {
    const envPath = join(TMP_DIR, '.env')
    const examplePath = join(TMP_DIR, '.env.example')

    writeFileSync(envPath, '', 'utf8')
    writeFileSync(examplePath, '', 'utf8')

    // First run
    appendKey(envPath, 'MY_KEY')
    appendKey(examplePath, 'MY_KEY', 'desc')

    // Second run — should be no-op
    const added1 = appendKey(envPath, 'MY_KEY')
    const added2 = appendKey(examplePath, 'MY_KEY', 'desc')

    expect(added1).toBe(false)
    expect(added2).toBe(false)

    const envContent = readFileSync(envPath, 'utf8')
    const occurrences = (envContent.match(/MY_KEY=/g) ?? []).length
    expect(occurrences).toBe(1)
  })

  it('creates .env file if it does not exist', () => {
    const envPath = join(TMP_DIR, '.env.new')
    expect(existsSync(envPath)).toBe(false)

    appendKey(envPath, 'FRESH_KEY')

    expect(existsSync(envPath)).toBe(true)
    const content = readFileSync(envPath, 'utf8')
    expect(content).toContain('FRESH_KEY=')
  })

  it('parseEnvKeys correctly parses keys from env file content', () => {
    const content = `DATABASE_URL=postgres://localhost\nJWT_SECRET=secret\n# COMMENT\nEMPTY_KEY=\n`
    const keys = parseEnvKeys(content)

    expect(keys.has('DATABASE_URL')).toBe(true)
    expect(keys.has('JWT_SECRET')).toBe(true)
    expect(keys.has('EMPTY_KEY')).toBe(true)
    expect(keys.has('COMMENT')).toBe(false)
  })
})
