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
import { resolveRouteRule, defaultRule, defaultRouteRules, type RouteRules } from '../route-rules'

// Feature: vono, Property 9: resolveRouteRule returns defaultRule for unmatched paths
describe('resolveRouteRule returns defaultRule for unmatched paths (Property 9)', () => {
  it('returns defaultRule when no pattern matches', () => {
    // Use an empty rules object — nothing will match
    fc.assert(
      fc.property(
        fc.stringMatching(/^\/[a-z0-9/-]*$/),
        (path) => {
          const result = resolveRouteRule(path, {})
          expect(result).toStrictEqual(defaultRule)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns defaultRule for paths not in defaultRouteRules', () => {
    // Paths that definitely won't match any default rule
    const unmatchedPaths = [
      '/unknown',
      '/some/random/path',
      '/api/v1/users',
      '/xyz',
    ]
    for (const path of unmatchedPaths) {
      const result = resolveRouteRule(path, defaultRouteRules)
      expect(result).toStrictEqual(defaultRule)
    }
  })
})

// Feature: vono, Property 10: resolveRouteRule first-match semantics
describe('resolveRouteRule first-match semantics (Property 10)', () => {
  it('returns the first matching rule when multiple patterns could match', () => {
    const rules: RouteRules = {
      '/blog/**': { mode: 'ssr', cache: 600 },
      '/blog/special': { mode: 'spa' }, // more specific but comes AFTER
    }

    // '/blog/special' matches '/blog/**' first — that rule wins
    const result = resolveRouteRule('/blog/special', rules)
    expect(result.mode).toBe('ssr')
    expect(result.cache).toBe(600)
  })

  it('more specific rules win when placed first', () => {
    const rules: RouteRules = {
      '/blog/special': { mode: 'spa' }, // specific — comes first
      '/blog/**': { mode: 'ssr', cache: 600 },
    }

    const result = resolveRouteRule('/blog/special', rules)
    expect(result.mode).toBe('spa')
  })

  it('exact match wins over wildcard when placed first', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('/dashboard', '/admin', '/settings'),
        (path) => {
          const rules: RouteRules = {
            [path]: { mode: 'ssr' }, // exact — first
            [`${path}/**`]: { mode: 'spa' }, // wildcard — second
          }
          const result = resolveRouteRule(path, rules)
          expect(result.mode).toBe('ssr')
        },
      ),
      { numRuns: 50 },
    )
  })

  it('wildcard matches sub-paths', () => {
    const result = resolveRouteRule('/dashboard/profile', defaultRouteRules)
    expect(result.mode).toBe('spa')

    const result2 = resolveRouteRule('/admin/users', defaultRouteRules)
    expect(result2.mode).toBe('spa')
  })

  it('SSR routes resolve correctly', () => {
    expect(resolveRouteRule('/', defaultRouteRules).mode).toBe('ssr')
    expect(resolveRouteRule('/about', defaultRouteRules).mode).toBe('ssr')
    expect(resolveRouteRule('/blog/my-post', defaultRouteRules).mode).toBe('ssr')
  })
})
