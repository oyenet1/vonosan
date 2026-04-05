/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmailDefinition<T> {
  subject: (data: T) => string
  html: (data: T) => string
  text?: (data: T) => string
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface EmailTemplate<T> {
  render: (data: T) => RenderedEmail
}

// ─── defineEmail ─────────────────────────────────────────────────────────────

/**
 * `defineEmail<T>({ subject, html, text })` — defines a typed email template.
 *
 * Returns an object with a `render(data)` method that produces the final
 * `{ subject, html, text }` strings.
 *
 * @example
 * ```ts
 * export const welcomeEmail = defineEmail<{ name: string; url: string }>({
 *   subject: (d) => `Welcome, ${d.name}!`,
 *   html: (d) => `<h1>Hi ${d.name}</h1><p><a href="${d.url}">Get started</a></p>`,
 *   text: (d) => `Hi ${d.name}. Get started: ${d.url}`,
 * })
 *
 * const { subject, html, text } = welcomeEmail.render({ name: 'Alice', url: 'https://...' })
 * ```
 */
export function defineEmail<T>(definition: EmailDefinition<T>): EmailTemplate<T> {
  return {
    render(data: T): RenderedEmail {
      return {
        subject: definition.subject(data),
        html: definition.html(data),
        text: definition.text ? definition.text(data) : stripHtml(definition.html(data)),
      }
    },
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Minimal HTML → plain text fallback when no `text` function is provided.
 * Strips tags and collapses whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
