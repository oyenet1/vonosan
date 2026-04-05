/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 *
 * Property-Based Tests for module scaffold file generation.
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.8**
 */

import { describe, it, expect } from 'bun:test'
import * as fc from 'fast-check'
import { generateModule } from '../generators/module-generator.js'
import { hasHeader } from '../header-generator.js'

// ─── Generators ───────────────────────────────────────────────────────────────

/** Valid module names: lowercase letters, digits, hyphens */
const moduleNameArb = fc
  .stringMatching(/^[a-z][a-z0-9-]*$/)
  .filter(n => n.length >= 2 && n.length <= 30)

// ─── Property 16: module scaffold produces all required files ─────────────────

describe('module scaffold produces all required files (Property 16)', () => {

  // ── 16a: API files are always generated when api=true ─────────────────────

  it('generates routes.ts, controller.ts, service.ts, dto.ts, schema.ts when api=true', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: true, frontend: false, saas: false })
        const paths = files.map(f => f.path)

        expect(paths.some(p => p.endsWith(`${name}.routes.ts`))).toBe(true)
        expect(paths.some(p => p.endsWith(`${name}.controller.ts`))).toBe(true)
        expect(paths.some(p => p.endsWith(`${name}.service.ts`))).toBe(true)
        expect(paths.some(p => p.endsWith(`${name}.dto.ts`))).toBe(true)
        expect(paths.some(p => p.endsWith(`${name}.schema.ts`))).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  // ── 16b: resource.ts and policy.ts are generated with api=true ────────────

  it('generates resource.ts and policy.ts when api=true', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: true, frontend: false, saas: false })
        const paths = files.map(f => f.path)

        expect(paths.some(p => p.endsWith(`${name}.resource.ts`))).toBe(true)
        expect(paths.some(p => p.endsWith(`${name}.policy.ts`))).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  // ── 16c: test files are generated with api=true ────────────────────────────

  it('generates unit, integration, and e2e test files when api=true', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: true, frontend: false, saas: false })
        const paths = files.map(f => f.path)

        expect(paths.some(p => p.endsWith(`${name}.unit.test.ts`))).toBe(true)
        expect(paths.some(p => p.endsWith(`${name}.integration.test.ts`))).toBe(true)
        expect(paths.some(p => p.endsWith(`${name}.e2e.test.ts`))).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  // ── 16d: frontend files are generated when frontend=true ──────────────────

  it('generates index.page.vue and composable when frontend=true', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: false, frontend: true, saas: false })
        const paths = files.map(f => f.path)

        expect(paths.some(p => p.endsWith('index.page.vue'))).toBe(true)
        expect(paths.some(p => p.includes('composables/'))).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  // ── 16e: no frontend files when frontend=false ────────────────────────────

  it('does not generate page or composable when frontend=false', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: true, frontend: false, saas: false })
        const paths = files.map(f => f.path)

        expect(paths.some(p => p.endsWith('.page.vue'))).toBe(false)
        expect(paths.some(p => p.includes('composables/'))).toBe(false)
      }),
      { numRuns: 100 },
    )
  })

  // ── 16f: every generated file has the Bonifade header ─────────────────────

  it('every generated file contains the Bonifade Technologies header', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: true, frontend: true, saas: false })
        for (const { path, content } of files) {
          // .vue files embed the header in a comment block — check for the marker
          const hasIt =
            hasHeader(content) ||
            content.includes('Bonifade Technologies') // .vue files use HTML comment
          expect(hasIt).toBe(true)
        }
      }),
      { numRuns: 50 },
    )
  })

  // ── 16g: saas mode adds deleted_at to schema ──────────────────────────────

  it('schema contains deleted_at when saas=true', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: true, frontend: false, saas: true })
        const schemaFile = files.find(f => f.path.endsWith(`${name}.schema.ts`))
        expect(schemaFile).toBeDefined()
        expect(schemaFile!.content).toContain('deleted_at')
      }),
      { numRuns: 100 },
    )
  })

  // ── 16h: non-saas schema does NOT contain deleted_at ─────────────────────

  it('schema does not contain deleted_at when saas=false', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: true, frontend: false, saas: false })
        const schemaFile = files.find(f => f.path.endsWith(`${name}.schema.ts`))
        expect(schemaFile).toBeDefined()
        expect(schemaFile!.content).not.toContain('deleted_at')
      }),
      { numRuns: 100 },
    )
  })

  // ── 16i: all file paths are under src/modules/<name>/ ─────────────────────

  it('all generated file paths are under src/modules/<name>/', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: true, frontend: true, saas: false })
        for (const { path } of files) {
          expect(path.startsWith(`src/modules/${name}/`)).toBe(true)
        }
      }),
      { numRuns: 100 },
    )
  })

  // ── 16j: no duplicate file paths ─────────────────────────────────────────

  it('no duplicate file paths are generated', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: true, frontend: true, saas: false })
        const paths = files.map(f => f.path)
        const unique = new Set(paths)
        expect(unique.size).toBe(paths.length)
      }),
      { numRuns: 100 },
    )
  })

  // ── 16k: api=false generates no API files ────────────────────────────────

  it('generates no API files when api=false', () => {
    fc.assert(
      fc.property(moduleNameArb, (name) => {
        const files = generateModule(name, { api: false, frontend: false, saas: false })
        expect(files).toHaveLength(0)
      }),
      { numRuns: 100 },
    )
  })
})
