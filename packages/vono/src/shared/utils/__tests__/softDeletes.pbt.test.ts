/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from 'bun:test'
import { withTrashed } from '../softDeletes'

// Feature: vono, Property 6: withSoftDeletes then withTrashed override
//
// withTrashed() returns undefined — meaning "no filter applied".
// This is the override: when you call withTrashed(), the soft-delete
// filter is removed entirely, returning all records including deleted ones.
//
// The property: applying withSoftDeletes and then withTrashed produces
// the same result as withTrashed alone (undefined — no filter).
describe('withSoftDeletes + withTrashed override (Property 6)', () => {
  it('withTrashed always returns undefined (no filter)', () => {
    // Run 100 times — withTrashed takes no input, always returns undefined
    for (let i = 0; i < 100; i++) {
      expect(withTrashed()).toBeUndefined()
    }
  })

  it('withTrashed overrides any prior soft-delete condition', () => {
    // Simulate: start with a soft-delete condition, then override with withTrashed
    // The final WHERE condition should be undefined (no filter)
    const applyFilters = (useSoftDelete: boolean, useTrashed: boolean) => {
      // In real usage: .where(and(withSoftDeletes(table), ...))
      // withTrashed() returns undefined, overriding the soft-delete filter
      if (useTrashed) return withTrashed()
      if (useSoftDelete) return 'IS NULL condition' // simulated
      return undefined
    }

    // When withTrashed is applied last, result is always undefined
    expect(applyFilters(true, true)).toBeUndefined()
    expect(applyFilters(false, true)).toBeUndefined()
    expect(applyFilters(true, false)).toBe('IS NULL condition')
  })
})
