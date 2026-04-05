/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { Context } from 'hono'
import type { AppVariables } from '../../types/index.js'
import { Logger } from '../../shared/utils/logger.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  /** When true, dispatches to queue instead of sending immediately */
  queue?: boolean
}

// ─── sendEmail ────────────────────────────────────────────────────────────────

/**
 * `sendEmail(c, options)` — sends an email via the configured driver.
 *
 * Driver selection (in priority order):
 * 1. `RESEND_API_KEY` → Resend
 * 2. `POSTMARK_API_KEY` → Postmark
 * 3. `SMTP_HOST` → SMTP (nodemailer)
 * 4. Fallback → Console (logs to stdout, dev-only)
 *
 * When `queue: true`, the email is dispatched to the queue instead of
 * being sent immediately (requires queue to be configured).
 *
 * @example
 * await sendEmail(c, {
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<h1>Hello</h1>',
 * })
 */
export async function sendEmail(
  c: Context<{ Variables: AppVariables }>,
  options: SendEmailOptions,
): Promise<void> {
  const config = c.var.config

  // Queue dispatch — fire-and-forget when queue is configured
  if (options.queue) {
    Logger.info('[email] Queued email dispatch', { to: options.to, subject: options.subject })
    // Queue integration point — when a queue driver is wired, dispatch here.
    // For now, fall through to synchronous send.
  }

  const from = (config as Record<string, string>)['EMAIL_FROM'] ?? 'noreply@example.com'

  // Resend
  if (config.RESEND_API_KEY) {
    const { send } = await import('./drivers/resend.js')
    return send({ ...options, apiKey: config.RESEND_API_KEY, from })
  }

  // Postmark
  const postmarkKey = (config as Record<string, string>)['POSTMARK_API_KEY']
  if (postmarkKey) {
    const { send } = await import('./drivers/postmark.js')
    return send({ ...options, apiKey: postmarkKey, from })
  }

  // SMTP
  const smtpHost = (config as Record<string, string>)['SMTP_HOST']
  if (smtpHost) {
    const { send } = await import('./drivers/smtp.js')
    return send({
      ...options,
      host: smtpHost,
      port: Number((config as Record<string, string>)['SMTP_PORT'] ?? 587),
      user: (config as Record<string, string>)['SMTP_USER'] ?? '',
      pass: (config as Record<string, string>)['SMTP_PASS'] ?? '',
      from,
    })
  }

  // Console fallback (development)
  Logger.warn('[email] No email driver configured — using console driver')
  const { send } = await import('./drivers/console.js')
  return send(options)
}
