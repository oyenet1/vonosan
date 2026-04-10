/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { ref, computed } from 'vue'
import type { ComputedRef } from 'vue'

// ─── Types ───────────────────────────────────────────────────────────

export interface UseI18nReturn {
  /** Translate a key with optional interpolation params */
  t: (key: string, params?: Record<string, string>) => string
  /** Reactive current locale */
  locale: ReturnType<typeof ref<string>>
  /** Set the active locale */
  setLocale: (newLocale: string) => void
  /** All available locale codes */
  availableLocales: ComputedRef<string[]>
}

// ─── Shared reactive state ───────────────────────────────────────────

const currentLocale = ref<string>(
  typeof window !== 'undefined'
    ? (document.documentElement.lang || 'en')
    : 'en',
)

const translations = ref<Record<string, Record<string, string>>>({})
const _availableLocales = ref<string[]>([])

// ─── useI18n ─────────────────────────────────────────────────────────

/**
 * Client-side i18n composable.
 *
 * Usage:
 * ```vue
 * <script setup>
 * const { t, locale, setLocale } = useI18n()
 * </script>
 * <template>
 *   <p>{{ t('greeting', { name: 'Alice' }) }}</p>
 * </template>
 * ```
 */
export function useI18n(): UseI18nReturn {
  /**
   * Translate a key for the current locale.
   * Falls back to the key itself if not found.
   */
  function t(key: string, params?: Record<string, string>): string {
    const dict = translations.value[currentLocale.value] ?? {}
    let value = dict[key] ?? key

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replaceAll(`{{${k}}}`, v)
      }
    }

    return value
  }

  /**
   * Switch the active locale and optionally load its translations.
   */
  async function setLocale(newLocale: string): Promise<void> {
    currentLocale.value = newLocale

    // Update <html lang="..."> for accessibility
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale
    }

    // Lazy-load translations if not already cached
    if (!translations.value[newLocale]) {
      try {
        const mod = await import(/* @vite-ignore */ `/locales/${newLocale}.json`)
        translations.value = {
          ...translations.value,
          [newLocale]: mod.default ?? mod,
        }
        if (!_availableLocales.value.includes(newLocale)) {
          _availableLocales.value = [..._availableLocales.value, newLocale]
        }
      } catch {
        // Translation file not found — silently continue
      }
    }
  }

  const availableLocales = computed(() => _availableLocales.value)

  return {
    t,
    locale: currentLocale,
    setLocale,
    availableLocales,
  }
}

/**
 * Seed initial translations (called during SSR hydration).
 */
export function seedTranslations(
  locale: string,
  dict: Record<string, string>,
  available: string[] = [],
): void {
  currentLocale.value = locale
  translations.value = { ...translations.value, [locale]: dict }
  if (available.length) {
    _availableLocales.value = available
  } else if (!_availableLocales.value.includes(locale)) {
    _availableLocales.value = [..._availableLocales.value, locale]
  }
}
