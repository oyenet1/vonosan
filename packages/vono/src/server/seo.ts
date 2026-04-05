/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Cache header constant ───────────────────────────────────────────

/**
 * Cache-Control header value for hashed static assets.
 * Use on `/assets/*` routes in production.
 */
export const IMMUTABLE_CACHE_HEADER = 'public, max-age=31536000, immutable'

// ─── Robots.txt ──────────────────────────────────────────────────────

export interface RobotsConfig {
  /** Base URL of the site, used to build the Sitemap reference */
  siteUrl: string
  /** Additional paths to disallow beyond the defaults */
  extraDisallow?: string[]
}

/**
 * buildRobotsTxt — generates robots.txt content.
 *
 * Blocks: /dashboard, /admin, /settings, /api
 * Includes a Sitemap reference pointing to <siteUrl>/sitemap.xml
 *
 * @example
 *   app.get('/robots.txt', (c) =>
 *     c.text(buildRobotsTxt({ siteUrl: 'https://example.com' }))
 *   )
 */
export function buildRobotsTxt(config: RobotsConfig): string {
  const defaultDisallow = ['/dashboard', '/admin', '/settings', '/api']
  const allDisallow = [...defaultDisallow, ...(config.extraDisallow ?? [])]

  const lines = [
    'User-agent: *',
    ...allDisallow.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${config.siteUrl}/sitemap.xml`,
  ]

  return lines.join('\n')
}

// ─── Sitemap.xml ─────────────────────────────────────────────────────

export interface SitemapPage {
  /** Absolute URL of the page */
  loc: string
  /** ISO 8601 date string, e.g. '2026-04-05' */
  lastmod?: string
  /** 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' */
  changefreq?: string
  /** Priority between 0.0 and 1.0 */
  priority?: number
}

/**
 * buildSitemapXml — generates a valid XML sitemap.
 *
 * @param baseUrl — base URL of the site (no trailing slash)
 * @param pages   — list of page descriptors; if empty, only the root is included
 *
 * @example
 *   app.get('/sitemap.xml', (c) =>
 *     c.text(buildSitemapXml('https://example.com', [
 *       { loc: '/about' },
 *       { loc: '/blog', changefreq: 'weekly', priority: 0.8 },
 *     ]), 200, { 'Content-Type': 'application/xml' })
 *   )
 */
export function buildSitemapXml(baseUrl: string, pages: SitemapPage[]): string {
  const base = baseUrl.replace(/\/$/, '')

  // Always include the root
  const allPages: SitemapPage[] = pages.length > 0 ? pages : [{ loc: '/' }]

  const urlEntries = allPages
    .map((page) => {
      const loc = page.loc.startsWith('http') ? page.loc : `${base}${page.loc}`
      const parts = [`    <loc>${escapeXml(loc)}</loc>`]

      if (page.lastmod) parts.push(`    <lastmod>${page.lastmod}</lastmod>`)
      if (page.changefreq) parts.push(`    <changefreq>${page.changefreq}</changefreq>`)
      if (page.priority !== undefined) parts.push(`    <priority>${page.priority.toFixed(1)}</priority>`)

      return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>',
  ].join('\n')
}

// ─── Helpers ─────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
