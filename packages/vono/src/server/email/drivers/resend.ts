/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { Logger } from '../../../shared/utils/logger.js'
import type { SendEmailOptions } from '../send-email.js'

/**
 * Resend driver — sends email via the Resend REST API.
 * Requires `RESEND_API_KEY` in environment.
 */
export async function send(options: SendEmailOptions & { apiKey: string; from: string }): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: options.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    Logger.error('[email:resend] Failed to send email', { status: res.status, body })
    throw new Error(`Resend API error: ${res.status} ${body}`)
  }

  Logger.info('[email:resend] Email sent', { to: options.to, subject: options.subject })
}
