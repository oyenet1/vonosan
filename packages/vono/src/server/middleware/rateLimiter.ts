/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { createMiddleware } from 'hono/factory'
import { Logger } from '../../shared/utils/logger.js'
import type { RateLimitTier } from '../../types/index.js'

// ─── Types ──────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimiterState {
  store: Map<string, RateLimitEntry>
  /** True once the cleanup interval has been registered */
  initialized: boolean
  /** The interval handle — kept so it can be cleared in tests */
  intervalHandle: ReturnType<typeof setInterval> | null
}

// ─── Core factory ───────────────────────────────────────────────────

/**
 * createRateLimiter — build a Hono middleware that enforces a sliding
 * window rate limit using an in-memory store.
 *
 * Lazy-init pattern: the cleanup setInterval is deferred to the FIRST
 * request so it is never called at module load time. This is required
 * for Cloudflare Workers compatibility — CF Workers prohibit top-level
 * I/O and timers outside of request handlers.
 *
 * @param tier    — { windowMs, limit } from VonoConfig.rateLimit
 * @param keyFn   — function to derive the rate-limit key from the request
 *                  (defaults to client IP)
 * @param message — custom 429 message
 */
export function createRateLimiter(
  tier: RateLimitTier,
  keyFn?: (c: Parameters<ReturnType<typeof createMiddleware>>[0]) => string,
  message = 'Too many attempts. Please try again later.',
) {
  const state: RateLimiterState = {
    store: new Map(),
    initialized: false,
    intervalHandle: null,
  }

  return createMiddleware(async (c, next) => {
    // ── Lazy init: register cleanup interval on first request ────────
    if (!state.initialized) {
      state.initialized = true
      // Purge expired entries every windowMs to prevent memory leaks.
      // Deferred here (not at module load) for CF Workers compatibility.
      state.intervalHandle = setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of state.store.entries()) {
          if (entry.resetAt <= now) {
            state.store.delete(key)
          }
        }
      }, tier.windowMs)

      // Allow the interval to be garbage-collected in serverless envs
      if (state.intervalHandle?.unref) {
        state.intervalHandle.unref()
      }
    }

    // ── Derive rate-limit key ────────────────────────────────────────
    const key = keyFn
      ? keyFn(c)
      : (c.req.header('x-forwarded-for') ??
         c.req.header('x-real-ip') ??
         'unknown')

    const now = Date.now()

    // ── Check / update store ─────────────────────────────────────────
    const existing = state.store.get(key)

    if (!existing || existing.resetAt <= now) {
      // First request in this window — or window has expired
      state.store.set(key, { count: 1, resetAt: now + tier.windowMs })
      await next()
      return
    }

    existing.count += 1

    if (existing.count > tier.limit) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000)

      Logger.warn('[vono] Rate limit exceeded', {
        key,
        count: existing.count,
        limit: tier.limit,
        retryAfterSec,
      })

      return c.json(
        {
          success: false,
          statusCode: 429,
          message,
        },
        429,
        {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(tier.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(existing.resetAt / 1000)),
        },
      )
    }

    // Under the limit — set informational headers and continue
    c.header('X-RateLimit-Limit', String(tier.limit))
    c.header('X-RateLimit-Remaining', String(Math.max(0, tier.limit - existing.count)))
    c.header('X-RateLimit-Reset', String(Math.ceil(existing.resetAt / 1000)))

    await next()
  })
}

// ─── Default tiers ──────────────────────────────────────────────────

/**
 * Default rate limit tiers — used when vono.config.ts does not specify
 * custom values. Projects should override these in their config.
 */
const DEFAULT_AUTH_TIER: RateLimitTier = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,                 // 10 login attempts per window
}

const DEFAULT_OTP_TIER: RateLimitTier = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 5,                  // 5 OTP attempts per window
}

const DEFAULT_API_TIER: RateLimitTier = {
  windowMs: 60 * 1000,       // 1 minute
  limit: 100,                // 100 requests per minute
}

// ─── Pre-built limiters ──────────────────────────────────────────────

/**
 * authRateLimiter — strict limiter for login / register endpoints.
 *
 * Uses DEFAULT_AUTH_TIER unless overridden via config.
 * Override in your src/index.ts:
 * ```ts
 * import { createRateLimiter } from 'vono/server'
 * const authRateLimiter = createRateLimiter(config.rateLimit?.auth ?? DEFAULT_AUTH_TIER)
 * ```
 */
export const authRateLimiter = createRateLimiter(
  DEFAULT_AUTH_TIER,
  undefined,
  'Too many login attempts. Please wait 15 minutes before trying again.',
)

/**
 * otpRateLimiter — strict limiter for OTP / password-reset endpoints.
 */
export const otpRateLimiter = createRateLimiter(
  DEFAULT_OTP_TIER,
  undefined,
  'Too many OTP attempts. Please wait 10 minutes before trying again.',
)

/**
 * apiRateLimiter — general-purpose limiter for public API endpoints.
 */
export const apiRateLimiter = createRateLimiter(
  DEFAULT_API_TIER,
  undefined,
  'Too many requests. Please slow down.',
)

// ─── Config-aware factory ────────────────────────────────────────────

/**
 * createConfiguredRateLimiters — build rate limiters from VonoConfig.
 *
 * Call this in your src/index.ts after loading vono.config.ts to get
 * limiters that respect your project's custom tier settings.
 *
 * Usage:
 * ```ts
 * import { createConfiguredRateLimiters } from 'vono/server'
 * import config from '../vono.config.js'
 *
 * const { authRateLimiter, otpRateLimiter, apiRateLimiter } =
 *   createConfiguredRateLimiters(config.rateLimit)
 *
 * authRoutes.use('/login', authRateLimiter)
 * authRoutes.use('/otp/verify', otpRateLimiter)
 * api.use('*', apiRateLimiter)
 * ```
 */
export function createConfiguredRateLimiters(rateLimitConfig?: {
  auth?: RateLimitTier
  otp?: RateLimitTier
  api?: RateLimitTier
}) {
  return {
    authRateLimiter: createRateLimiter(
      rateLimitConfig?.auth ?? DEFAULT_AUTH_TIER,
      undefined,
      'Too many login attempts. Please wait before trying again.',
    ),
    otpRateLimiter: createRateLimiter(
      rateLimitConfig?.otp ?? DEFAULT_OTP_TIER,
      undefined,
      'Too many OTP attempts. Please wait before trying again.',
    ),
    apiRateLimiter: createRateLimiter(
      rateLimitConfig?.api ?? DEFAULT_API_TIER,
      undefined,
      'Too many requests. Please slow down.',
    ),
  }
}
