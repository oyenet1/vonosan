/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { RouteRule, RouteRules } from './route-rules.js'
import { resolveRouteRule } from './route-rules.js'
import { Logger } from '../shared/utils/logger.js'

export interface RenderResult {
  html: string
  head: string
  bodyAttrs: string
  htmlAttrs: string
  piniaState: string
  rule: RouteRule
}

/** Static 500 fallback — served when both SSR and error page rendering fail */
const STATIC_500 = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>500 — Server Error</title></head>
<body><h1>500 — Internal Server Error</h1><p>Something went wrong. Please try again later.</p></body>
</html>`

/**
 * Render a URL using SSR or return a bare SPA shell.
 *
 * This function is called by the Hono server for every page request.
 * It delegates to the project's createApp factory (src/main.ts).
 *
 * @param url - The request URL path
 * @param routeRules - The project's route rules config
 * @param createApp - The project's createApp factory
 * @param templateHtml - The index.html template string
 * @param fallbackToSpa - Whether to fall back to SPA on SSR error
 */
export async function render(
  url: string,
  routeRules: RouteRules,
  createApp: (opts: { isServer: boolean; url: string }) => {
    app: unknown
    router: { push: (url: string) => Promise<void>; isReady: () => Promise<void> }
    pinia: { state: { value: Record<string, unknown> } }
    head: unknown
  },
  fallbackToSpa = false,
): Promise<RenderResult> {
  const rule = resolveRouteRule(url, routeRules)

  // ── SPA mode: return empty shell ──────────────────────────────────
  if (rule.mode === 'spa') {
    return buildSpaResult(rule)
  }

  // ── SSR mode: full server render ──────────────────────────────────
  try {
    const { renderToString } = await import('vue/server-renderer')
    const { renderSSRHead } = await import('@unhead/ssr')

    const { app, router, pinia, head } = createApp({ isServer: true, url })

    await router.push(url)
    await router.isReady()

    const ctx: Record<string, unknown> = {}
    const html = await renderToString(app as Parameters<typeof renderToString>[0], ctx)

    const headPayload = await renderSSRHead(head as Parameters<typeof renderSSRHead>[0])

    // Serialize Pinia state — XSS-safe escaping handled in injectPiniaState
    const piniaState = JSON.stringify(pinia.state.value)

    return {
      html,
      head: headPayload.headTags,
      bodyAttrs: headPayload.bodyAttrs ?? '',
      htmlAttrs: headPayload.htmlAttrs ?? '',
      piniaState,
      rule,
    }
  } catch (err) {
    Logger.error('[vono] SSR render error', { url, error: String(err) })

    if (fallbackToSpa) {
      Logger.warn('[vono] Falling back to SPA shell due to SSR error', { url })
      return buildSpaResult(rule)
    }

    throw err
  }
}

/**
 * Build the final HTML string from the template and render result.
 * Injects SSR content, head tags, Pinia state, and cache headers.
 */
export function buildHtml(template: string, result: RenderResult): string {
  let html = template
    .replace('<!--ssr-outlet-->', result.html)
    .replace('<!--head-outlet-->', result.head)

  // Inject Pinia state for client hydration (SSR only, non-empty state)
  if (result.rule.mode === 'ssr' && result.piniaState && result.piniaState !== '{}') {
    const stateScript = injectPiniaState(result.piniaState)
    html = html.replace('<!--state-outlet-->', stateScript)
  } else {
    html = html.replace('<!--state-outlet-->', '')
  }

  // Apply htmlAttrs and bodyAttrs
  if (result.htmlAttrs) {
    html = html.replace('<html lang="en">', `<html lang="en" ${result.htmlAttrs}>`)
  }
  if (result.bodyAttrs) {
    html = html.replace('<body>', `<body ${result.bodyAttrs}>`)
  }

  return html
}

/**
 * Serialize Pinia state into a script tag with XSS escaping.
 * Escapes < and > to prevent </script> injection attacks.
 *
 * Property 11: Pinia state SSR round-trip
 */
export function injectPiniaState(piniaState: string): string {
  const escaped = piniaState
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
  return `<script id="__pinia" type="application/json">${escaped}</script>`
}

/** Build a bare SPA shell result */
function buildSpaResult(rule: RouteRule): RenderResult {
  return {
    html: '',
    head: '<title>App</title>',
    bodyAttrs: '',
    htmlAttrs: '',
    piniaState: '',
    rule,
  }
}

export { STATIC_500 }
