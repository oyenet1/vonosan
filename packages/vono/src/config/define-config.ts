/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { VonoConfig } from '../types/index.js'

// Resolved config singleton — set once at startup
let _resolvedConfig: VonoConfig | null = null

/**
 * Define and validate the Vono framework configuration.
 *
 * Place this in `vono.config.ts` at the project root:
 * ```ts
 * import { defineVonoConfig } from 'vonosan'
 * export default defineVonoConfig({ ... })
 * ```
 */
export function defineVonoConfig(config: VonoConfig): VonoConfig {
  validateConfig(config)
  _resolvedConfig = config
  return config
}

/**
 * Get the resolved config. Throws if defineVonoConfig has not been called.
 */
export function getResolvedConfig(): VonoConfig {
  if (!_resolvedConfig) {
    throw new Error(
      '[vono] Configuration not initialized. ' +
      'Ensure vono.config.ts exports a defineVonoConfig() call.',
    )
  }
  return _resolvedConfig
}

// ─── Validation ─────────────────────────────────────────────────────

function validateConfig(config: VonoConfig): void {
  if (!config.app) {
    throw new Error('[vono] defineVonoConfig: "app" section is required')
  }
  if (!config.app.name) {
    throw new Error('[vono] defineVonoConfig: "app.name" is required')
  }
  if (!config.runtime) {
    throw new Error('[vono] defineVonoConfig: "runtime" is required')
  }
  if (!config.mode) {
    throw new Error('[vono] defineVonoConfig: "mode" is required (fullstack | api)')
  }

  const validRuntimes = [
    'cloudflare-workers', 'cloudflare-pages', 'bun', 'node',
    'deno', 'aws-lambda', 'vercel', 'netlify', 'fastly',
  ]
  if (!validRuntimes.includes(config.runtime)) {
    throw new Error(
      `[vono] defineVonoConfig: invalid runtime "${config.runtime}". ` +
      `Valid options: ${validRuntimes.join(', ')}`,
    )
  }

  if (!['fullstack', 'api'].includes(config.mode)) {
    throw new Error(
      `[vono] defineVonoConfig: invalid mode "${config.mode}". ` +
      `Valid options: fullstack, api`,
    )
  }
}
