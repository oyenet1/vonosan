/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 *
 * Property-Based Tests for the email template system.
 * Uses fast-check for property generation.
 *
 * **Validates: Requirements 13**
 */

import { describe, it, expect } from 'bun:test'
import * as fc from 'fast-check'
import { defineEmail } from '../define-email'

// ─── Property 13: email template render contains data values ─────────────────

/**
 * **Validates: Requirements 13**
 *
 * Property: For any typed data object, `render(data)` produces a
 * `{ subject, html, text }` triple where:
 * - `subject` is a non-empty string
 * - `html` contains the data values that were interpolated
 * - `text` is a non-empty string
 */
describe('email template render contains data values (Property 13)', () => {
  // Generator: objects with string values (safe to interpolate into HTML)
  const safeStringRecord = fc.dictionary(
    fc.stringMatching(/^[a-z][a-zA-Z0-9]*$/),
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('<') && !s.includes('>')),
  ).filter((obj) => Object.keys(obj).length > 0)

  it('render returns an object with subject, html, and text fields', () => {
    fc.assert(
      fc.property(safeStringRecord, (data) => {
        const keys = Object.keys(data)
        const firstKey = keys[0]
        const firstValue = data[firstKey]

        const template = defineEmail<typeof data>({
          subject: (d) => `Subject: ${d[firstKey]}`,
          html: (d) => `<p>${d[firstKey]}</p>`,
          text: (d) => `Text: ${d[firstKey]}`,
        })

        const rendered = template.render(data)

        expect(typeof rendered.subject).toBe('string')
        expect(typeof rendered.html).toBe('string')
        expect(typeof rendered.text).toBe('string')
        expect(rendered.subject.length).toBeGreaterThan(0)
        expect(rendered.html.length).toBeGreaterThan(0)
        expect(rendered.text.length).toBeGreaterThan(0)

        // The rendered output must contain the interpolated data value
        expect(rendered.subject).toContain(firstValue)
        expect(rendered.html).toContain(firstValue)
        expect(rendered.text).toContain(firstValue)
      }),
      { numRuns: 100 },
    )
  })

  it('render subject contains interpolated data values', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes('<')),
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes('<')),
        (name, url) => {
          const template = defineEmail<{ name: string; url: string }>({
            subject: (d) => `Welcome, ${d.name}!`,
            html: (d) => `<h1>Hi ${d.name}</h1><a href="${d.url}">Click</a>`,
            text: (d) => `Hi ${d.name}. Visit: ${d.url}`,
          })

          const rendered = template.render({ name, url })

          expect(rendered.subject).toContain(name)
          expect(rendered.html).toContain(name)
          expect(rendered.html).toContain(url)
          expect(rendered.text).toContain(name)
          expect(rendered.text).toContain(url)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('render falls back to stripped HTML for text when no text function provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes('<') && !s.includes('>') && s.trim().length > 0),
        (value) => {
          const template = defineEmail<{ value: string }>({
            subject: (d) => `Subject ${d.value}`,
            html: (d) => `<p>${d.value}</p>`,
            // No text function — should fall back to stripped HTML
          })

          const rendered = template.render({ value })

          // text should be derived from html (tags stripped)
          // Use trimmed value since stripHtml collapses whitespace
          expect(rendered.text).toContain(value.trim())
          expect(rendered.text).not.toContain('<p>')
          expect(rendered.text).not.toContain('</p>')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('render is deterministic — same data always produces same output', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes('<')),
        (name) => {
          const template = defineEmail<{ name: string }>({
            subject: (d) => `Hello ${d.name}`,
            html: (d) => `<p>Hello ${d.name}</p>`,
            text: (d) => `Hello ${d.name}`,
          })

          const first = template.render({ name })
          const second = template.render({ name })

          expect(first.subject).toBe(second.subject)
          expect(first.html).toBe(second.html)
          expect(first.text).toBe(second.text)
        },
      ),
      { numRuns: 100 },
    )
  })
})
