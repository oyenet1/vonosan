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

export interface SmtpOptions {
  host: string
  port: number
  user: string
  pass: string
  from: string
  secure?: boolean
}

/**
 * SMTP driver — sends email via nodemailer (Node/Bun only).
 * Not compatible with Cloudflare Workers.
 *
 * Dynamically imports nodemailer to avoid bundling it in CF Workers builds.
 */
export async function send(options: SendEmailOptions & SmtpOptions): Promise<void> {
  // Dynamic import — nodemailer is a Node.js-only dependency
  const nodemailer = await import('nodemailer').catch(() => {
    throw new Error('[email:smtp] nodemailer is not installed. Run: bun add nodemailer')
  })

  const transporter = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure ?? options.port === 465,
    auth: { user: options.user, pass: options.pass },
  })

  await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })

  Logger.info('[email:smtp] Email sent', { to: options.to, subject: options.subject })
}
