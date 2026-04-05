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
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { lintProject } from '../../../../cli/src/linter.js'

// ─── Helpers ─────────────────────────────────────────────────────────

const TMP_DIR = join(import.meta.dir, '__tmp_linter__')

function writeFile(relPath: string, content: string): void {
  const absPath = join(TMP_DIR, relPath)
  mkdirSync(absPath.substring(0, absPath.lastIndexOf('/')), { recursive: true })
  writeFileSync(absPath, content, 'utf8')
}

function cleanup() {
  if (existsSync(TMP_DIR)) {
    rmSync(TMP_DIR, { recursive: true, force: true })
  }
}

const HEADER = `/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */`

// ─── Tests ───────────────────────────────────────────────────────────

describe('linter integration', () => {
  beforeEach(() => {
    cleanup()
    mkdirSync(TMP_DIR, { recursive: true })
  })

  afterEach(cleanup)

  it('detects header violations in files without the Bonifade header', async () => {
    writeFile('src/modules/test/test.service.ts', `export function hello() { return 'hi' }`)

    const results = await lintProject(join(TMP_DIR, 'src'))
    const headerViolations = results.filter((r) => r.rule === 'header-missing')

    expect(headerViolations.length).toBeGreaterThan(0)
    expect(headerViolations[0].message).toContain('Bonifade')
  })

  it('does not flag files that have the header', async () => {
    writeFile(
      'src/modules/test/test.service.ts',
      `${HEADER}\n\nexport function hello() { return 'hi' }`,
    )

    const results = await lintProject(join(TMP_DIR, 'src'))
    const headerViolations = results.filter((r) => r.rule === 'header-missing')

    expect(headerViolations.length).toBe(0)
  })

  it('detects console.log violations', async () => {
    writeFile(
      'src/modules/test/test.controller.ts',
      `${HEADER}\n\nexport function handler() { console.log('debug') }`,
    )

    const results = await lintProject(join(TMP_DIR, 'src'))
    const logViolations = results.filter((r) => r.rule === 'console-log')

    expect(logViolations.length).toBeGreaterThan(0)
    expect(logViolations[0].message).toContain('Logger')
  })

  it('does not flag console.log in logger.ts itself', async () => {
    writeFile(
      'src/shared/utils/logger.ts',
      `${HEADER}\n\n// eslint-disable-next-line no-console\nconsole.info('allowed here')`,
    )

    const results = await lintProject(join(TMP_DIR, 'src'))
    const logViolations = results.filter(
      (r) => r.rule === 'console-log' && r.file.includes('logger.ts'),
    )

    expect(logViolations.length).toBe(0)
  })

  it('detects versioning violations in routes files', async () => {
    writeFile(
      'src/modules/test/test.routes.ts',
      `${HEADER}\n\napp.get('/users', handler)`,
    )

    const results = await lintProject(join(TMP_DIR, 'src'))
    const versionViolations = results.filter((r) => r.rule === 'versioning-missing-prefix')

    expect(versionViolations.length).toBeGreaterThan(0)
    expect(versionViolations[0].message).toContain('/api/v1/')
  })

  it('does not flag versioned routes', async () => {
    writeFile(
      'src/modules/test/test.routes.ts',
      `${HEADER}\n\napp.get('/api/v1/users', handler)`,
    )

    const results = await lintProject(join(TMP_DIR, 'src'))
    const versionViolations = results.filter((r) => r.rule === 'versioning-missing-prefix')

    expect(versionViolations.length).toBe(0)
  })
})
