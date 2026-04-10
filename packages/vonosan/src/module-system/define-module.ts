/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { ZodSchema } from 'zod'

// ─── Types ───────────────────────────────────────────────────────────

export type VonosanLifecycleHook =
  | 'app:created'
  | 'app:ready'
  | 'build:before'
  | 'build:after'
  | 'routes:resolved'

export interface VonosanModuleHooks {
  'app:created'?: (...args: unknown[]) => void | Promise<void>
  'app:ready'?: (...args: unknown[]) => void | Promise<void>
  'build:before'?: (...args: unknown[]) => void | Promise<void>
  'build:after'?: (...args: unknown[]) => void | Promise<void>
  'routes:resolved'?: (...args: unknown[]) => void | Promise<void>
}

export interface VonosanModuleDefinition {
  /** Unique module identifier, e.g. '@vonosan/auth' */
  name: string

  /** Semver version string */
  version: string

  /** Other module names this module depends on */
  requires?: string[]

  /** Hono middleware to register globally */
  middleware?: Array<(...args: unknown[]) => unknown>

  /** Zod schemas exported by this module */
  schemas?: Record<string, ZodSchema>

  /** Server-side auto-imports to inject */
  serverImports?: Array<{ from: string; imports: string[] }>

  /** Client-side auto-imports to inject */
  clientImports?: Array<{ from: string; imports: string[] }>

  /** Page components to register */
  pages?: Array<{ path: string; component: string }>

  /** Vue components to register */
  components?: Array<{ name: string; path: string }>

  /** API routes to register */
  routes?: Array<{ path: string; handler: string }>

  /** Drizzle migration files */
  migrations?: string[]

  /** Zod schema for module config validation */
  configSchema?: ZodSchema

  /** Setup function called when the module is initialized */
  setup?: (options?: Record<string, unknown>) => void | Promise<void>

  /** Lifecycle hooks */
  hooks?: VonosanModuleHooks
}

// ─── defineVonosanModule ────────────────────────────────────────────────

/**
 * defineVonosanModule — validates and returns the module definition.
 *
 * Throws if required fields (name, version) are missing.
 *
 * @example
 * ```ts
 * export default defineVonosanModule({
 *   name: '@vonosan/auth',
 *   version: '0.1.0',
 *   setup: async () => { ... },
 *   hooks: {
 *     'app:ready': (app) => { ... },
 *   },
 * })
 * ```
 */
export function defineVonosanModule(definition: VonosanModuleDefinition): VonosanModuleDefinition {
  if (!definition.name) {
    throw new Error('[vonosan] defineVonosanModule: "name" is required')
  }

  if (!definition.version) {
    throw new Error(`[vonosan] defineVonosanModule: "version" is required for module "${definition.name}"`)
  }

  return definition
}
