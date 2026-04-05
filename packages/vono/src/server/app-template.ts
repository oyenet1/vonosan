/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { Hono } from 'hono'
import { logger as honoLogger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { cors } from 'hono/cors'
import { configProvider } from './middleware/configProvider.js'
import { dbProvider } from './middleware/dbProvider.js'
import { autoRegisterRoutes } from '../shared/utils/autoRoutes.js'
import { Logger } from '../shared/utils/logger.js'
import type { VonoConfig, AppVariables, Env } from '../types/index.js'

// ─── Types ──────────────────────────────────────────────────────────

export interface VonoAppOptions {
  /**
   * The resolved vono.config.ts object.
   * Pass the result of defineVonoConfig() here.
   */
  config: VonoConfig

  /**
   * Optional OpenAPI spec object.
   * If provided, GET /openapi.json will serve it.
   */
  openApiSpec?: Record<string, unknown>
}

// ─── Factory ────────────────────────────────────────────────────────

/**
 * createVonoApp — two-layer Hono app factory.
 *
 * Layer 1 (outer): global middleware (logger, prettyJSON, CORS),
 *   health check, robots.txt, sitemap.xml, API docs endpoints.
 *
 * Layer 2 (inner): versioned API router at /api/v1 with
 *   configProvider, dbProvider, and auto-registered module routes.
 *
 * Usage in your project's src/index.ts:
 * ```ts
 * import { createVonoApp } from 'vono/server'
 * import config from '../vono.config.js'
 * import openApiSpec from './openapi.js'
 *
 * const app = createVonoApp({ config, openApiSpec })
 * export default app
 * ```
 */
export function createVonoApp(options: VonoAppOptions): Hono<{ Variables: AppVariables; Bindings: Env }> {
  const { config, openApiSpec } = options

  // ── Outer app ────────────────────────────────────────────────────
  const app = new Hono<{ Variables: AppVariables; Bindings: Env }>()

  // ── Global middleware ────────────────────────────────────────────

  // Structured request logging via Hono's built-in logger
  app.use('*', honoLogger((message) => {
    Logger.info(message)
  }))

  // Pretty-print JSON in development
  if (config.app.env !== 'production') {
    app.use('*', prettyJSON())
  }

  // ── CORS ─────────────────────────────────────────────────────────
  app.use('*', buildCorsMiddleware(config))

  // ── Outer health check (GET /) ───────────────────────────────────
  app.get('/', (c) => {
    return c.json({
      success: true,
      message: `${config.app.name} API is running`,
      timestamp: new Date().toISOString(),
    })
  })

  // ── robots.txt ───────────────────────────────────────────────────
  app.get('/robots.txt', (c) => {
    const appUrl = config.app.url ?? ''
    const body = [
      'User-agent: *',
      'Disallow: /dashboard',
      'Disallow: /admin',
      'Disallow: /settings',
      'Disallow: /api',
      '',
      `Sitemap: ${appUrl}/sitemap.xml`,
    ].join('\n')

    return c.text(body, 200, { 'Content-Type': 'text/plain' })
  })

  // ── sitemap.xml ──────────────────────────────────────────────────
  app.get('/sitemap.xml', (c) => {
    const appUrl = config.app.url ?? ''
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      `  <url><loc>${appUrl}/</loc></url>`,
      '</urlset>',
    ].join('\n')

    return c.text(xml, 200, { 'Content-Type': 'application/xml' })
  })

  // ── API docs endpoints ───────────────────────────────────────────
  if (config.docs) {
    mountDocEndpoints(app, config, openApiSpec)
  }

  // ── Inner API router (Layer 2) ───────────────────────────────────
  const api = new Hono<{ Variables: AppVariables; Bindings: Env }>()

  // Apply per-request middleware on the inner router
  api.use('*', configProvider)
  api.use('*', dbProvider)

  // Auto-discover and mount all *.routes.ts files from src/modules/
  autoRegisterRoutes(api).catch((err) => {
    Logger.error('[vono] autoRegisterRoutes failed', { error: String(err) })
  })

  // Mount inner router at /api/v1
  app.route('/api/v1', api)

  Logger.info(`[vono] App created — ${config.app.name} (${config.app.env})`)

  return app
}

// ─── CORS helper ────────────────────────────────────────────────────

/**
 * Build CORS middleware from vono.config.ts + ALLOWED_ORIGINS env var.
 *
 * Priority:
 *   1. config.cors.origins (explicit list in vono.config.ts)
 *   2. ALLOWED_ORIGINS env var (comma-separated)
 *   3. Dev auto-allow: localhost:4000 and localhost:5173
 */
function buildCorsMiddleware(config: VonoConfig) {
  const isDev = config.app.env !== 'production'

  // Collect allowed origins
  const configOrigins: string[] = config.cors?.origins ?? []

  const envOrigins: string[] = (() => {
    const raw =
      (typeof process !== 'undefined' ? process.env['ALLOWED_ORIGINS'] : undefined) ?? ''
    return raw
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
  })()

  const devOrigins = isDev ? ['http://localhost:4000', 'http://localhost:5173'] : []

  const allOrigins = [...new Set([...configOrigins, ...envOrigins, ...devOrigins])]

  return cors({
    origin: allOrigins.length > 0 ? allOrigins : '*',
    allowHeaders: config.cors?.allowHeaders ?? ['Content-Type', 'Authorization'],
    allowMethods: config.cors?.allowMethods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: config.cors?.credentials ?? true,
  })
}

// ─── API docs helper ─────────────────────────────────────────────────

/**
 * Mount API documentation endpoints:
 *   GET /openapi.json  — raw OpenAPI 3.1 spec
 *   GET /docs          — Swagger UI
 *   GET /reference     — Scalar API reference
 *   GET /fp/*          — Fiberplane dev tools
 */
function mountDocEndpoints(
  app: Hono<{ Variables: AppVariables; Bindings: Env }>,
  config: VonoConfig,
  openApiSpec?: Record<string, unknown>,
): void {
  const docsConfig = config.docs!

  // ── GET /openapi.json ────────────────────────────────────────────
  app.get('/openapi.json', (c) => {
    if (openApiSpec) {
      return c.json(openApiSpec)
    }
    // Fallback: minimal spec
    return c.json({
      openapi: '3.1.0',
      info: { title: config.app.name, version: '1.0.0' },
      paths: {},
    })
  })

  // ── GET /docs (Swagger UI) ───────────────────────────────────────
  if (docsConfig.swagger) {
    app.get('/docs', (c) => {
      const html = buildSwaggerHtml(docsConfig.openapi ?? '/openapi.json')
      return c.html(html)
    })
  }

  // ── GET /reference (Scalar) ──────────────────────────────────────
  if (docsConfig.scalar) {
    app.get('/reference', (c) => {
      const html = buildScalarHtml(docsConfig.openapi ?? '/openapi.json', config.app.name)
      return c.html(html)
    })
  }

  // ── GET /fp/* (Fiberplane) ───────────────────────────────────────
  if (docsConfig.fiberplane) {
    app.get('/fp/*', (c) => {
      return c.json({
        message: 'Fiberplane integration — mount @fiberplane/hono in your project',
        docs: 'https://fiberplane.com/docs',
      })
    })
  }
}

// ─── HTML builders ───────────────────────────────────────────────────

function buildSwaggerHtml(specUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API Docs — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '${specUrl}',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
    })
  </script>
</body>
</html>`
}

function buildScalarHtml(specUrl: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — API Reference</title>
</head>
<body>
  <script
    id="api-reference"
    data-url="${specUrl}"
    src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`
}
