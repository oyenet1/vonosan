/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Context } from 'hono'
import { Logger } from '../../shared/utils/logger.js'

// ─── In-memory translation cache ────────────────────────────────────

const translationCache = new Map<string, Record<string, string>>()

// ─── Locale context key ──────────────────────────────────────────────

const LOCALE_KEY = '__vono_locale__'

// ─── loadTranslations ────────────────────────────────────────────────

/**
 * Lazy-loads `src/locales/<locale>.json` from disk.
 * Results are cached in memory after the first load.
 *
 * @param locale     — locale code, e.g. 'en', 'fr'
 * @param localesDir — absolute path to the locales directory
 */
export function loadTranslations(
  locale: string,
  localesDir: string,
): Record<string, string> {
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!
  }

  const filePath = join(localesDir, `${locale}.json`)

  if (!existsSync(filePath)) {
    Logger.warn(`[i18n] Translation file not found: ${filePath}`)
    translationCache.set(locale, {})
    return {}
  }

  try {
    const raw = readFileSync(filePath, 'utf8')
    const translations = JSON.parse(raw) as Record<string, string>
    translationCache.set(locale, translations)
    return translations
  } catch (err) {
    Logger.error(`[i18n] Failed to parse translation file: ${filePath}`, {
      error: String(err),
    })
    translationCache.set(locale, {})
    return {}
  }
}

// ─── t ───────────────────────────────────────────────────────────────

/**
 * Translate a key for the given locale.
 * Supports `{{param}}` interpolation.
 *
 * @example
 *   t('en', 'greeting', { name: 'Alice' })
 *   // "Hello, Alice!" (if en.json has { "greeting": "Hello, {{name}}!" })
 */
export function t(
  locale: string,
  key: string,
  params?: Record<string, string>,
): string {
  const translations = translationCache.get(locale) ?? {}
  let value = translations[key] ?? key

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replaceAll(`{{${k}}}`, v)
    }
  }

  return value
}

// ─── getLocale ───────────────────────────────────────────────────────

/**
 * Gets the current locale stored on the Hono context.
 * Set by `detectLocale` + `c.set(LOCALE_KEY, locale)` in middleware.
 */
export function getLocale(c: Context): string {
  return (c.get(LOCALE_KEY as string) as string | undefined) ?? 'en'
}

/**
 * Sets the current locale on the Hono context.
 * Call this in your i18n middleware after detecting the locale.
 */
export function setLocale(c: Context, locale: string): void {
  c.set(LOCALE_KEY as string, locale)
}
