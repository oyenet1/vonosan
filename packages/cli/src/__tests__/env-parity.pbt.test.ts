/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 *
 * Property-Based Tests for .env / .env.example key parity.
 *
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import * as fc from 'fast-check'
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { parseEnvKeys, checkEnvParity } from '../linter/env-parity.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generates valid UPPER_SNAKE_CASE env key strings */
const envKeyArb = fc
  .stringMatching(/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/)
  .filter(k => k.length >= 2 && k.length <= 30)

/** Generates a set of unique env keys */
const envKeySetArb = fc
  .uniqueArray(envKeyArb, { minLength: 1, maxLength: 10 })
  .map(keys => new Set(keys))

/** Serialises a set of keys to .env file content */
function toEnvContent(keys: Set<string>): string {
  return [...keys].map(k => `${k}=`).join('\n') + '\n'
}

/** Serialises a set of keys to .env.example file content */
function toExampleContent(keys: Set<string>): string {
  return [...keys].map(k => `${k}= # placeholder`).join('\n') + '\n'
}

// ─── Property 2: .env / .env.example key parity ──────────────────────────────

describe('.env / .env.example key parity (Property 2)', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join(tmpdir(), `vono-pbt-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  // ── 2a: parseEnvKeys correctly extracts all keys ──────────────────────────

  it('parseEnvKeys extracts exactly the keys present in the file', () => {
    fc.assert(
      fc.property(envKeySetArb, (keys) => {
        const content = toEnvContent(keys)
        const parsed = parseEnvKeys(content)
        expect(parsed).toEqual(keys)
      }),
      { numRuns: 100 },
    )
  })

  it('parseEnvKeys ignores comment lines and blank lines', () => {
    fc.assert(
      fc.property(envKeySetArb, fc.array(fc.string({ maxLength: 30 }), { maxLength: 5 }), (keys, comments) => {
        const commentLines = comments.map(c => `# ${c}`).join('\n')
        const content = commentLines + '\n' + toEnvContent(keys)
        const parsed = parseEnvKeys(content)
        expect(parsed).toEqual(keys)
      }),
      { numRuns: 100 },
    )
  })

  // ── 2b: After env:add both files have the same keys ───────────────────────

  it('when .env and .env.example have identical keys, checkEnvParity reports no missing keys', () => {
    fc.assert(
      fc.property(envKeySetArb, (keys) => {
        writeFileSync(join(tmpDir, '.env'), toEnvContent(keys), 'utf8')
        writeFileSync(join(tmpDir, '.env.example'), toExampleContent(keys), 'utf8')

        const result = checkEnvParity(tmpDir)
        expect(result.missingInExample).toHaveLength(0)
        expect(result.missingInEnv).toHaveLength(0)
      }),
      { numRuns: 100 },
    )
  })

  it('keys in .env but not in .env.example are reported as missingInExample', () => {
    fc.assert(
      fc.property(
        envKeySetArb,
        envKeySetArb,
        (envKeys, extraKeys) => {
          // Ensure extraKeys are disjoint from envKeys
          const disjointExtra = new Set([...extraKeys].filter(k => !envKeys.has(k)))
          if (disjointExtra.size === 0) return // skip degenerate case

          const allEnvKeys = new Set([...envKeys, ...disjointExtra])
          writeFileSync(join(tmpDir, '.env'), toEnvContent(allEnvKeys), 'utf8')
          writeFileSync(join(tmpDir, '.env.example'), toExampleContent(envKeys), 'utf8')

          const result = checkEnvParity(tmpDir)
          for (const key of disjointExtra) {
            expect(result.missingInExample).toContain(key)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('keys in .env.example but not in .env are reported as missingInEnv', () => {
    fc.assert(
      fc.property(
        envKeySetArb,
        envKeySetArb,
        (envKeys, extraKeys) => {
          const disjointExtra = new Set([...extraKeys].filter(k => !envKeys.has(k)))
          if (disjointExtra.size === 0) return

          const allExampleKeys = new Set([...envKeys, ...disjointExtra])
          writeFileSync(join(tmpDir, '.env'), toEnvContent(envKeys), 'utf8')
          writeFileSync(join(tmpDir, '.env.example'), toExampleContent(allExampleKeys), 'utf8')

          const result = checkEnvParity(tmpDir)
          for (const key of disjointExtra) {
            expect(result.missingInEnv).toContain(key)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns empty lists when .env does not exist (no error)', () => {
    // No .env file written
    const result = checkEnvParity(tmpDir)
    expect(result.missingInExample).toHaveLength(0)
    expect(result.missingInEnv).toHaveLength(0)
  })

  // ── 2c: Parity is symmetric — swapping files swaps the missing lists ───────

  it('parity check is symmetric: swapping .env and .env.example swaps the missing lists', () => {
    fc.assert(
      fc.property(
        envKeySetArb,
        envKeySetArb,
        (keysA, keysB) => {
          // Write A → .env, B → .env.example
          writeFileSync(join(tmpDir, '.env'), toEnvContent(keysA), 'utf8')
          writeFileSync(join(tmpDir, '.env.example'), toExampleContent(keysB), 'utf8')
          const resultAB = checkEnvParity(tmpDir)

          // Swap: B → .env, A → .env.example
          writeFileSync(join(tmpDir, '.env'), toEnvContent(keysB), 'utf8')
          writeFileSync(join(tmpDir, '.env.example'), toExampleContent(keysA), 'utf8')
          const resultBA = checkEnvParity(tmpDir)

          // missingInExample(A,B) === missingInEnv(B,A)
          expect(new Set(resultAB.missingInExample)).toEqual(new Set(resultBA.missingInEnv))
          expect(new Set(resultAB.missingInEnv)).toEqual(new Set(resultBA.missingInExample))
        },
      ),
      { numRuns: 100 },
    )
  })
})
