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
import {
  generateChallenge,
  buildRegistrationOptions,
  buildAuthenticationOptions,
  bufferToBase64url,
  base64urlToBuffer,
} from '../lib/passkey.js'

describe('Passkey helpers', () => {
  describe('generateChallenge', () => {
    it('returns a base64url-encoded challenge and expiry', () => {
      const { challenge, expiresAt } = generateChallenge()
      expect(typeof challenge).toBe('string')
      expect(challenge.length).toBeGreaterThan(0)
      expect(expiresAt).toBeGreaterThan(Date.now())
    })

    it('generates unique challenges on each call', () => {
      const a = generateChallenge()
      const b = generateChallenge()
      expect(a.challenge).not.toBe(b.challenge)
    })

    it('challenge decodes to 32 bytes', () => {
      const { challenge } = generateChallenge()
      const bytes = base64urlToBuffer(challenge)
      expect(bytes.length).toBe(32)
    })
  })

  describe('buildRegistrationOptions', () => {
    it('returns correct rp, user, and pubKeyCredParams', () => {
      const opts = buildRegistrationOptions({
        rpId: 'example.com',
        rpName: 'Example App',
        userId: bufferToBase64url(new Uint8Array([1, 2, 3])),
        userName: 'alice@example.com',
        userDisplayName: 'Alice',
        challenge: generateChallenge().challenge,
      })

      expect((opts as Record<string, unknown>).rp).toEqual({ id: 'example.com', name: 'Example App' })
      expect(Array.isArray((opts as Record<string, unknown>).pubKeyCredParams)).toBe(true)
      expect(((opts as Record<string, unknown>).pubKeyCredParams as unknown[]).length).toBeGreaterThan(0)
    })

    it('includes ES256 and RS256 in pubKeyCredParams', () => {
      const opts = buildRegistrationOptions({
        rpId: 'example.com',
        rpName: 'Example',
        userId: 'dXNlcg',
        userName: 'user',
        userDisplayName: 'User',
        challenge: 'abc123',
      }) as { pubKeyCredParams: Array<{ alg: number }> }

      const algs = opts.pubKeyCredParams.map((p) => p.alg)
      expect(algs).toContain(-7)   // ES256
      expect(algs).toContain(-257) // RS256
    })
  })

  describe('buildAuthenticationOptions', () => {
    it('returns rpId, challenge, and userVerification', () => {
      const opts = buildAuthenticationOptions({
        rpId: 'example.com',
        challenge: generateChallenge().challenge,
        userVerification: 'preferred',
      }) as Record<string, unknown>

      expect(opts.rpId).toBe('example.com')
      expect(opts.userVerification).toBe('preferred')
      expect(typeof opts.challenge).toBe('string')
    })
  })

  describe('base64url encoding round-trip', () => {
    it('bufferToBase64url → base64urlToBuffer produces original bytes', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128])
      const encoded = bufferToBase64url(original)
      const decoded = base64urlToBuffer(encoded)
      expect(decoded).toEqual(original)
    })

    it('does not contain +, /, or = characters', () => {
      const bytes = crypto.getRandomValues(new Uint8Array(64))
      const encoded = bufferToBase64url(bytes)
      expect(encoded).not.toContain('+')
      expect(encoded).not.toContain('/')
      expect(encoded).not.toContain('=')
    })
  })
})
