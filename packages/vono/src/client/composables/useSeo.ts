/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { useHead } from '@unhead/vue'

export interface SeoOptions {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: string
  twitterCard?: 'summary' | 'summary_large_image'
  noIndex?: boolean
  structuredData?: Record<string, unknown>
}

/**
 * Set all SEO meta tags for the current page.
 * Works in both SSR and client — tags are server-rendered into HTML.
 *
 * Usage:
 * ```ts
 * useSeo({
 *   title: 'My Page',
 *   description: 'Page description',
 *   canonical: '/my-page',
 *   ogImage: '/images/og.png',
 * })
 * ```
 */
export function useSeo(options: SeoOptions): void {
  const baseUrl = import.meta.env.SSR
    ? (process.env.APP_URL ?? 'https://myapp.com')
    : window.location.origin

  const canonical = options.canonical
    ? `${baseUrl}${options.canonical}`
    : undefined

  const ogImage = options.ogImage
    ? options.ogImage.startsWith('http')
      ? options.ogImage
      : `${baseUrl}${options.ogImage}`
    : `${baseUrl}/images/og-default.png`

  useHead({
    title: options.title,
    meta: [
      { name: 'description', content: options.description },
      ...(options.noIndex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),

      // Open Graph
      { property: 'og:title', content: options.title },
      { property: 'og:description', content: options.description },
      { property: 'og:type', content: options.ogType ?? 'website' },
      { property: 'og:image', content: ogImage },
      ...(canonical ? [{ property: 'og:url', content: canonical }] : []),

      // Twitter Card
      { name: 'twitter:card', content: options.twitterCard ?? 'summary_large_image' },
      { name: 'twitter:title', content: options.title },
      { name: 'twitter:description', content: options.description },
      { name: 'twitter:image', content: ogImage },
    ],
    link: [
      ...(canonical ? [{ rel: 'canonical', href: canonical }] : []),
    ],
    script: options.structuredData
      ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(options.structuredData) }]
      : [],
  })
}
