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
 * Console driver — logs email to stdout instead of sending.
 * Use in development / testing environments only.
 */
export async function send(options: SendEmailOptions): Promise<void> {
  Logger.info('[email:console] Email would be sent', {
    to: options.to,
    subject: options.subject,
    text: options.text?.slice(0, 200),
  })
}
