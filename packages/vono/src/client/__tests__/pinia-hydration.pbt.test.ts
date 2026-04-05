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
import * as fc from 'fast-check'
import { serializePiniaState } from '../pinia-hydration'

// Feature: vono, Property 11: Pinia state SSR round-trip
describe('Pinia state SSR round-trip (Property 11)', () => {
  // Arbitrary for JSON-serializable state objects
  const jsonValue: fc.Arbitrary<unknown> = fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.array(fc.string()),
    fc.dictionary(fc.string(), fc.string()),
  )

  const stateArb = fc.dictionary(
    fc.string({ minLength: 1 }),
    fc.dictionary(fc.string(), jsonValue),
  )

  it('serializing then deserializing produces equivalent state', () => {
    fc.assert(
      fc.property(stateArb, (state) => {
        // Server: serialize
        const serialized = serializePiniaState(state)

        // Client: deserialize (JSON.parse reverses the escaping)
        // The escaped \u003c and \u003e are valid JSON unicode escapes
        const deserialized = JSON.parse(serialized) as typeof state

        expect(deserialized).toStrictEqual(state)
      }),
      { numRuns: 100 },
    )
  })

  it('serialized output does not contain raw < or > characters', () => {
    fc.assert(
      fc.property(stateArb, (state) => {
        const serialized = serializePiniaState(state)
        expect(serialized).not.toContain('<')
        expect(serialized).not.toContain('>')
      }),
      { numRuns: 100 },
    )
  })

  it('handles state with HTML-like string values safely', () => {
    const state = {
      user: { name: '<script>alert("xss")</script>', role: 'admin' },
    }
    const serialized = serializePiniaState(state)
    expect(serialized).not.toContain('<script>')
    const deserialized = JSON.parse(serialized)
    expect(deserialized.user.name).toBe('<script>alert("xss")</script>')
  })
})
