/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 *
 * Property-Based Tests for core utilities.
 * Uses fast-check for property generation.
 */

import { describe, it, expect } from 'bun:test'
import * as fc from 'fast-check'
import { ApiResponse } from '../response'
import { buildPaginationMeta } from '../pagination'
import { toCamel } from '../mappers'
import { generateId, prefixedId } from '../id'

// ─── Property 3: ApiResponse.success shape invariant ───────────────

// Feature: vono, Property 3: ApiResponse.success shape invariant
describe('ApiResponse.success shape invariant (Property 3)', () => {
  it('always returns success=true with the provided message and data', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        fc.string(),
        (data, message) => {
          const result = ApiResponse.success(data, message)
          expect(result.success).toBe(true)
          expect(result.message).toBe(message)
          expect(result.data).toStrictEqual(data)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('uses default message "Success" when none provided', () => {
    fc.assert(
      fc.property(fc.anything(), (data) => {
        const result = ApiResponse.success(data)
        expect(result.success).toBe(true)
        expect(result.message).toBe('Success')
      }),
      { numRuns: 100 },
    )
  })
})

// ─── Property 4: ApiResponse.failure shape invariant ───────────────

// Feature: vono, Property 4: ApiResponse.failure shape invariant
describe('ApiResponse.failure shape invariant (Property 4)', () => {
  it('always returns success=false with the provided message', () => {
    fc.assert(
      fc.property(fc.string(), (message) => {
        const result = ApiResponse.failure(message)
        expect(result.success).toBe(false)
        expect(result.message).toBe(message)
        expect(result.data).toBeUndefined()
      }),
      { numRuns: 100 },
    )
  })

  it('includes errors when provided', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.dictionary(fc.string(), fc.string()),
        (message, errors) => {
          const result = ApiResponse.failure(message, errors)
          expect(result.success).toBe(false)
          expect(result.errors).toStrictEqual(errors)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─── Property 5: buildPaginationMeta correctness ───────────────────

// Feature: vono, Property 5: buildPaginationMeta correctness
describe('buildPaginationMeta correctness (Property 5)', () => {
  it('total_pages === Math.ceil(total / limit)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 10000 }),
        (page, limit, total) => {
          const meta = buildPaginationMeta(page, limit, total)
          expect(meta.total_pages).toBe(Math.ceil(total / limit))
        },
      ),
      { numRuns: 100 },
    )
  })

  it('has_next === page < total_pages', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 10000 }),
        (page, limit, total) => {
          const meta = buildPaginationMeta(page, limit, total)
          expect(meta.has_next).toBe(page < meta.total_pages)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('has_prev === page > 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 10000 }),
        (page, limit, total) => {
          const meta = buildPaginationMeta(page, limit, total)
          expect(meta.has_prev).toBe(page > 1)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('page_size equals the provided limit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 10000 }),
        (page, limit, total) => {
          const meta = buildPaginationMeta(page, limit, total)
          expect(meta.page_size).toBe(limit)
          expect(meta.page).toBe(page)
          expect(meta.total_items).toBe(total)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─── Property 7: toCamel idempotence ───────────────────────────────

// Feature: vono, Property 7: toCamel idempotence
describe('toCamel idempotence (Property 7)', () => {
  // Generate objects with snake_case keys
  const snakeCaseObj = fc.dictionary(
    fc.stringMatching(/^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)*$/),
    fc.oneof(fc.string(), fc.integer(), fc.boolean()),
  )

  it('toCamel(toCamel(obj)) === toCamel(obj)', () => {
    fc.assert(
      fc.property(snakeCaseObj, (obj) => {
        const once = toCamel(obj)
        const twice = toCamel(once)
        expect(twice).toStrictEqual(once)
      }),
      { numRuns: 100 },
    )
  })
})

// ─── Property 8: toCamel converts all snake_case keys ──────────────

// Feature: vono, Property 8: toCamel converts all snake_case keys
describe('toCamel converts all snake_case keys (Property 8)', () => {
  function hasSnakeCaseKey(obj: unknown): boolean {
    if (Array.isArray(obj)) return obj.some(hasSnakeCaseKey)
    if (obj !== null && typeof obj === 'object') {
      for (const key of Object.keys(obj as object)) {
        if (key.includes('_')) return true
        if (hasSnakeCaseKey((obj as Record<string, unknown>)[key])) return true
      }
    }
    return false
  }

  it('no snake_case keys remain after toCamel', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.stringMatching(/^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)+$/),
          fc.oneof(fc.string(), fc.integer()),
        ),
        (obj) => {
          const result = toCamel(obj)
          expect(hasSnakeCaseKey(result)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─── Property 14: generateId returns valid UUID v4 ─────────────────

// Feature: vono, Property 14: generateId returns valid UUID v4
describe('generateId returns valid UUID v4 (Property 14)', () => {
  const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  it('every call returns a valid UUID v4', () => {
    // Run 100 times manually (generateId takes no input)
    for (let i = 0; i < 100; i++) {
      const id = generateId()
      expect(id).toMatch(UUID_V4_PATTERN)
    }
  })

  it('every call returns a unique value', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

// ─── Property 15: prefixedId prefix round-trip ─────────────────────

// Feature: vono, Property 15: prefixedId prefix round-trip
describe('prefixedId prefix round-trip (Property 15)', () => {
  it('splitting on "_" and taking index 0 returns the original prefix', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9]*$/),
        (prefix) => {
          const id = prefixedId(prefix)
          // Format: prefix_uuid — split on first underscore
          const firstUnderscore = id.indexOf('_')
          const extractedPrefix = id.slice(0, firstUnderscore)
          expect(extractedPrefix).toBe(prefix)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('the part after the prefix is a valid UUID v4', () => {
    const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9]*$/),
        (prefix) => {
          const id = prefixedId(prefix)
          const firstUnderscore = id.indexOf('_')
          const uuidPart = id.slice(firstUnderscore + 1)
          expect(uuidPart).toMatch(UUID_V4_PATTERN)
        },
      ),
      { numRuns: 100 },
    )
  })
})
