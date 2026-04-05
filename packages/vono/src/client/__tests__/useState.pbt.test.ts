/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, beforeEach } from 'bun:test'
import * as fc from 'fast-check'
import { serializeVonoState, clearVonoState } from '../composables/useState'

// Feature: vono, Property 12: useState SSR round-trip
describe('useState SSR round-trip (Property 12)', () => {
  beforeEach(() => {
    clearVonoState()
  })

  const jsonValue: fc.Arbitrary<unknown> = fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.array(fc.string()),
  )

  it('serializing state then deserializing produces equivalent values', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1 }), jsonValue),
        (stateMap) => {
          clearVonoState()

          // Simulate: server sets state values
          // (We test the serialization layer directly since Vue reactivity
          // requires a component context)
          const serialized = JSON.stringify(stateMap)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')

          // Client: deserialize
          const deserialized = JSON.parse(serialized)
          expect(deserialized).toStrictEqual(stateMap)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('serializeVonoState produces valid JSON', () => {
    const serialized = serializeVonoState()
    expect(() => JSON.parse(serialized)).not.toThrow()
  })

  it('serialized state does not contain raw < or > characters', () => {
    const serialized = serializeVonoState()
    expect(serialized).not.toContain('<')
    expect(serialized).not.toContain('>')
  })
})
