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
import { mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { generateModule, writeModule } from '../../../../cli/src/generators/module-generator.js'

// ─── Helpers ─────────────────────────────────────────────────────────

const TMP_DIR = join(import.meta.dir, '__tmp_module_scaffold__')

function cleanup() {
  if (existsSync(TMP_DIR)) {
    rmSync(TMP_DIR, { recursive: true, force: true })
  }
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('module scaffold integration', () => {
  beforeEach(() => {
    cleanup()
    mkdirSync(TMP_DIR, { recursive: true })
  })

  afterEach(cleanup)

  it('generateModule creates all required files for an API module', () => {
    const files = generateModule('products', { api: true, frontend: false, saas: false })

    const paths = files.map((f) => f.path)

    expect(paths.some((p) => p.includes('products.routes.ts'))).toBe(true)
    expect(paths.some((p) => p.includes('products.controller.ts'))).toBe(true)
    expect(paths.some((p) => p.includes('products.service.ts'))).toBe(true)
    expect(paths.some((p) => p.includes('products.dto.ts'))).toBe(true)
    expect(paths.some((p) => p.includes('products.schema.ts'))).toBe(true)
    expect(paths.some((p) => p.includes('products.resource.ts'))).toBe(true)
    expect(paths.some((p) => p.includes('products.policy.ts'))).toBe(true)
  })

  it('generateModule includes frontend files when frontend: true', () => {
    const files = generateModule('products', { api: true, frontend: true, saas: false })
    const paths = files.map((f) => f.path)

    expect(paths.some((p) => p.includes('.page.vue'))).toBe(true)
    expect(paths.some((p) => p.includes('composables/'))).toBe(true)
  })

  it('writeModule writes all files to disk', () => {
    const files = generateModule('orders', { api: true, frontend: false, saas: false })
    writeModule('orders', files, TMP_DIR)

    for (const file of files) {
      const absPath = join(TMP_DIR, file.path)
      expect(existsSync(absPath)).toBe(true)
    }
  })

  it('writeModule throws when module directory already exists', () => {
    const files = generateModule('invoices', { api: true, frontend: false, saas: false })

    // Write once
    writeModule('invoices', files, TMP_DIR)

    // Second write should throw
    expect(() => writeModule('invoices', files, TMP_DIR)).toThrow(/already exists/)
  })

  it('generated files contain the Bonifade header', () => {
    const files = generateModule('reports', { api: true, frontend: false, saas: false })

    for (const file of files) {
      if (file.path.endsWith('.ts') || file.path.endsWith('.vue')) {
        expect(file.content).toContain('Bonifade Technologies')
      }
    }
  })
})
