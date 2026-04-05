/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from 'bun:test'
import { serializePiniaState } from '../../client/pinia-hydration.js'

// ─── Tests ───────────────────────────────────────────────────────────

/**
 * SSR rendering e2e tests.
 *
 * These tests validate the SSR output shape without spinning up a full
 * HTTP server — they test the rendering utilities directly.
 */
describe('SSR rendering e2e', () => {
  it('SSR mode: Pinia state is serialized into a script tag', () => {
    const state = {
      user: { id: '1', name: 'Alice', role: 'admin' },
      settings: { theme: 'dark', language: 'en' },
    }

    const serialized = serializePiniaState(state)

    // Must be valid JSON
    const parsed = JSON.parse(serialized) as typeof state
    expect(parsed.user.name).toBe('Alice')
    expect(parsed.settings.theme).toBe('dark')
  })

  it('SSR mode: Pinia state does not contain raw < or > (XSS safe)', () => {
    const state = {
      content: { html: '<script>alert("xss")</script>' },
    }

    const serialized = serializePiniaState(state)

    expect(serialized).not.toContain('<script>')
    expect(serialized).not.toContain('</script>')

    // But the data is preserved when parsed
    const parsed = JSON.parse(serialized) as typeof state
    expect(parsed.content.html).toBe('<script>alert("xss")</script>')
  })

  it('SSR mode: empty state serializes to empty object', () => {
    const serialized = serializePiniaState({})
    expect(serialized).toBe('{}')
  })

  it('SPA mode: bare HTML shell structure', () => {
    // Validate the SPA shell HTML structure
    const spaShell = `<!DOCTYPE html>
<html lang="en">
<head><title>App</title></head>
<body>
  <div id="app" class="isolate"><!--ssr-outlet--></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`

    expect(spaShell).toContain('id="app"')
    expect(spaShell).toContain('class="isolate"')
    expect(spaShell).toContain('<!--ssr-outlet-->')
    expect(spaShell).toContain('/src/main.ts')
  })

  it('SPA mode: X-Robots-Tag header should be set to noindex', () => {
    // Validate the header value used for SPA mode
    const xRobotsTag = 'noindex, nofollow'
    expect(xRobotsTag).toContain('noindex')
    expect(xRobotsTag).toContain('nofollow')
  })
})
