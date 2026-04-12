/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// vonosan/client — client-side composables and utilities
export { useAsyncData } from './composables/useAsyncData.js'
export { useVonosanFetch } from './composables/useVonosanFetch.js'
export { useCookie } from './composables/useCookie.js'
export { useState, serializeVonoState, clearVonoState } from './composables/useState.js'
export { navigateTo, setSSRRedirectHandler } from './composables/navigateTo.js'
export { useSeo } from './composables/useSeo.js'
export { useRouteRules } from './composables/useRouteRules.js'
export { useFormErrors } from './composables/useFormErrors.js'
export { hydratePinia, serializePiniaState } from './pinia-hydration.js'

// Layouts
export { resolveLayout } from './layouts/index.js'
export type { LayoutName } from './layouts/index.js'

// Nuxt UI setup
export { setupNuxtUI } from './nuxt-ui/index.js'
