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
import type { RouteRules } from './route-rules.js'
import { resolveRouteRule } from './route-rules.js'
import { buildHtml, injectPiniaState, STATIC_500 } from './renderer.js'
import { Logger } from '../shared/utils/logger.js'

export interface StreamRenderResult {
  vueStream: ReadableStream
  headTags: string
  bodyAttrs: string
  htmlAttrs: string
  piniaState: string
}

/**
 * Render a URL as a streaming SSR response.
 *
 * Sends the <head> section immediately, then streams Vue-rendered HTML
 * in chunks, minimizing Time to First Byte (TTFB).
 *
 * Falls back to null for SPA routes (caller should use non-streaming path).
 */
export async function renderStream(
  url: string,
  routeRules: RouteRules,
  createApp: (opts: { isServer: boolean; url: string }) => {
    app: unknown
    router: { push: (url: string) => Promise<void>; isReady: () => Promise<void> }
    pinia: { state: { value: Record<string, unknown> } }
    head: unknown
  },
): Promise<StreamRenderResult | null> {
  const rule = resolveRouteRule(url, routeRules)

  // SPA routes don't stream
  if (rule.mode === 'spa') return null

  const { renderToWebStream } = await import('vue/server-renderer')
  const { renderSSRHead } = await import('@unhead/ssr')

  const { app, router, pinia, head } = createApp({ isServer: true, url })

  await router.push(url)
  await router.isReady()

  const vueStream = renderToWebStream(app as Parameters<typeof renderToWebStream>[0])
  const headPayload = await renderSSRHead(head as Parameters<typeof renderSSRHead>[0])

  return {
    vueStream,
    headTags: headPayload.headTags,
    bodyAttrs: headPayload.bodyAttrs ?? '',
    htmlAttrs: headPayload.htmlAttrs ?? '',
    piniaState: JSON.stringify(pinia.state.value),
  }
}

/**
 * Stream an SSR response using Hono's stream() helper.
 *
 * Writes the <head> immediately, then pipes Vue chunks, then closes.
 */
export async function streamResponse(
  c: Context,
  url: string,
  routeRules: RouteRules,
  templateHtml: string,
  createApp: Parameters<typeof renderStream>[2],
): Promise<Response> {
  const { stream } = await import('hono/streaming')

  try {
    const result = await renderStream(url, routeRules, createApp)

    if (!result) {
      // SPA fallback — non-streaming
      const rule = resolveRouteRule(url, routeRules)
      c.header('X-Robots-Tag', 'noindex, nofollow')
      return c.html(buildHtml(templateHtml, {
        html: '', head: '<title>App</title>',
        bodyAttrs: '', htmlAttrs: '', piniaState: '', rule,
      }))
    }

    const [beforeApp, afterApp] = templateHtml.split('<!--ssr-outlet-->')
    let headSection = beforeApp.replace('<!--head-outlet-->', result.headTags)

    if (result.htmlAttrs) {
      headSection = headSection.replace('<html lang="en">', `<html lang="en" ${result.htmlAttrs}>`)
    }
    if (result.bodyAttrs) {
      headSection = headSection.replace('<body>', `<body ${result.bodyAttrs}>`)
    }

    const piniaScript =
      result.piniaState && result.piniaState !== '{}'
        ? injectPiniaState(result.piniaState)
        : ''

    const closing = afterApp.replace('<!--state-outlet-->', piniaScript)

    return stream(c, async (s) => {
      await s.write(headSection)

      const reader = result.vueStream.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        await s.write(typeof value === 'string' ? value : decoder.decode(value))
      }

      await s.write(closing)
    })
  } catch (err) {
    Logger.error('[vono] Stream render error', { url, error: String(err) })
    return c.html(STATIC_500, 500)
  }
}
