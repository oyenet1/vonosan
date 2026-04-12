/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// Main vonosan entry — config and composables
export { defineVonosanConfig, getResolvedConfig } from './config/define-config.js'
export { useVonosanConfig } from './config/use-config.js'
export { env, envNumber, envBool, envRequired } from './config/env-helpers.js'
export type { PublicVonosanConfig } from './config/use-config.js'
export type { VonosanConfig } from './types/index.js'
export * from './types/index.js'

// Module system
export { defineVonosanModule, registerModule, getModules, runHook, clearRegistry } from './module-system/index.js'
export type { VonosanModuleDefinition, VonosanModuleHooks, VonosanLifecycleHook } from './module-system/index.js'
