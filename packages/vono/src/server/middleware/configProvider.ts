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
import type { Config, AppVariables, Env } from '../../types/index.js'

/**
 * Config provider middleware.
 *
 * Reads environment variables from c.env (Cloudflare Workers) or
 * process.env (Node/Bun), validates required vars, and sets c.var.config.
 *
 * Apply once on the inner API router — all feature modules inherit it.
 *
 * Usage:
 *   api.use('*', configProvider)
 */
export const configProvider = createMiddleware<{
  Variables: AppVariables
  Bindings: Env
}>(async (c, next) => {
  const bindings = (c.env as Record<string, string | undefined>) ?? {}

  /**
   * Read a required env var — throws if missing.
   */
  function get(key: string): string {
    const value =
      bindings[key] ??
      (typeof process !== 'undefined' ? process.env[key] : undefined)
    if (!value) {
      throw new Error(
        `[vono] configProvider: Missing required env var: ${key}\n` +
        `Add it to your .env file.`,
      )
    }
    return value
  }

  /**
   * Read an optional env var — returns empty string if missing.
   */
  function getOptional(key: string): string {
    return (
      bindings[key] ??
      (typeof process !== 'undefined' ? process.env[key] : undefined) ??
      ''
    )
  }

  const config: Config = {
    // Required
    DATABASE_URL: get('DATABASE_URL'),
    JWT_SECRET: get('JWT_SECRET'),

    // Optional with defaults
    CLIENT_URL: getOptional('CLIENT_URL'),
    NODE_ENV: getOptional('NODE_ENV') || 'development',
    ALLOWED_ORIGINS: getOptional('ALLOWED_ORIGINS'),

    // OAuth
    GOOGLE_CLIENT_ID: getOptional('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: getOptional('GOOGLE_CLIENT_SECRET'),
    GITHUB_CLIENT_ID: getOptional('GITHUB_CLIENT_ID'),
    GITHUB_CLIENT_SECRET: getOptional('GITHUB_CLIENT_SECRET'),

    // Email
    RESEND_API_KEY: getOptional('RESEND_API_KEY'),

    // Payment
    PAYSTACK_PUBLIC_KEY: getOptional('PAYSTACK_PUBLIC_KEY'),
    PAYSTACK_SECRET_KEY: getOptional('PAYSTACK_SECRET_KEY'),
    PAYSTACK_WEBHOOK_SECRET: getOptional('PAYSTACK_WEBHOOK_SECRET'),
    STRIPE_PUBLISHABLE_KEY: getOptional('STRIPE_PUBLISHABLE_KEY'),
    STRIPE_SECRET_KEY: getOptional('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: getOptional('STRIPE_WEBHOOK_SECRET'),
    PAYMENT_CREDS_ENCRYPTION_KEY: getOptional('PAYMENT_CREDS_ENCRYPTION_KEY'),

    // Cloudflare
    CLOUDFLARE_API_TOKEN: getOptional('CLOUDFLARE_API_TOKEN'),
    CLOUDFLARE_ACCOUNT_ID: getOptional('CLOUDFLARE_ACCOUNT_ID'),
    CLOUDFLARE_ZONE_NAME: getOptional('CLOUDFLARE_ZONE_NAME'),
  }

  c.set('config', config)
  await next()
})
