/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { sign, verify } from 'hono/jwt'
import { Logger } from 'vono/server'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TokenPayload {
  sub: string
  email: string
  role: string
  [key: string]: unknown
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * `signAccessToken(payload, secret)` — signs a short-lived access token (15 min).
 */
export async function signAccessToken(
  payload: TokenPayload,
  secret: string,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 15 // 15 minutes
  return sign({ ...payload, exp }, secret)
}

/**
 * `signRefreshToken(payload, secret)` — signs a long-lived refresh token (7 days).
 */
export async function signRefreshToken(
  payload: TokenPayload,
  secret: string,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
  return sign({ ...payload, exp }, secret)
}

/**
 * `verifyToken(token, secret)` — verifies a JWT and returns the payload.
 * Returns null on any error (expired, invalid signature, malformed).
 */
export async function verifyToken(
  token: string,
  secret: string,
): Promise<TokenPayload | null> {
  try {
    const payload = await verify(token, secret)
    return payload as TokenPayload
  } catch (err) {
    Logger.debug('[jwt] Token verification failed', { error: String(err) })
    return null
  }
}
