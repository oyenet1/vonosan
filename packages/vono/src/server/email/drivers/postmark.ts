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
 * Postmark driver — sends email via the Postmark REST API.
 * Requires `POSTMARK_API_KEY` in environment.
 */
export async function send(options: SendEmailOptions & { apiKey: string; from: string }): Promise<void> {
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'X-Postmark-Server-Token': options.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      From: options.from,
      To: options.to,
      Subject: options.subject,
      HtmlBody: options.html,
      TextBody: options.text,
      MessageStream: 'outbound',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    Logger.error('[email:postmark] Failed to send email', { status: res.status, body })
    throw new Error(`Postmark API error: ${res.status} ${body}`)
  }

  Logger.info('[email:postmark] Email sent', { to: options.to, subject: options.subject })
}
