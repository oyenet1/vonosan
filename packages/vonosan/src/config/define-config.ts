/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { VonosanConfig } from '../types/index.js'

// Resolved config singleton — set once at startup
let _resolvedConfig: VonosanConfig | null = null

/**
 * Define and validate the Vonosan framework configuration.
 *
 * Place this in `vonosan.config.ts` at the project root:
 * ```ts
 * import { defineVonosanConfig } from 'vonosan'
 * export default defineVonosanConfig({ ... })
 * ```
 */
export function defineVonosanConfig(config: VonosanConfig): VonosanConfig {
  validateConfig(config)
  _resolvedConfig = config
  return config
}

/**
 * Get the resolved config. Throws if defineVonosanConfig has not been called.
 */
export function getResolvedConfig(): VonosanConfig {
  if (!_resolvedConfig) {
    throw new Error(
      '[vonosan] Configuration not initialized. ' +
      'Ensure vonosan.config.ts exports a defineVonosanConfig() call.',
    )
  }
  return _resolvedConfig
}

// ─── Validation ─────────────────────────────────────────────────────

function validateConfig(config: VonosanConfig): void {
  if (!config.app) {
    throw new Error('[vonosan] defineVonosanConfig: "app" section is required')
  }
  if (!config.app.name) {
    throw new Error('[vonosan] defineVonosanConfig: "app.name" is required')
  }
  if (!config.runtime) {
    throw new Error('[vonosan] defineVonosanConfig: "runtime" is required')
  }
  if (!config.mode) {
    throw new Error('[vonosan] defineVonosanConfig: "mode" is required (fullstack | api)')
  }

  const validRuntimes = [
    'cloudflare-workers', 'cloudflare-pages', 'bun', 'node',
    'deno', 'aws-lambda', 'vercel', 'netlify', 'fastly',
  ]
  if (!validRuntimes.includes(config.runtime)) {
    throw new Error(
      `[vonosan] defineVonosanConfig: invalid runtime "${config.runtime}". ` +
      `Valid options: ${validRuntimes.join(', ')}`,
    )
  }

  if (!['fullstack', 'api'].includes(config.mode)) {
    throw new Error(
      `[vonosan] defineVonosanConfig: invalid mode "${config.mode}". ` +
      `Valid options: fullstack, api`,
    )
  }
}
