/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { VonoModuleDefinition, VonoLifecycleHook } from './define-module.js'
import { Logger } from '../shared/utils/logger.js'

// ─── Registry state ──────────────────────────────────────────────────

const registry: VonoModuleDefinition[] = []

// ─── registerModule ──────────────────────────────────────────────────

/**
 * registerModule — adds a module to the global registry.
 *
 * Throws if a module with the same name is already registered.
 */
export function registerModule(module: VonoModuleDefinition): void {
  const existing = registry.find((m) => m.name === module.name)

  if (existing) {
    throw new Error(
      `[vono] Module "${module.name}" is already registered. ` +
        `Each module can only be registered once.`,
    )
  }

  registry.push(module)
  Logger.info(`[vono] Module registered: ${module.name}@${module.version}`)
}

// ─── getModules ──────────────────────────────────────────────────────

/**
 * getModules — returns all registered modules.
 */
export function getModules(): VonoModuleDefinition[] {
  return [...registry]
}

// ─── runHook ─────────────────────────────────────────────────────────

/**
 * runHook — runs all registered hooks for a lifecycle event.
 *
 * Hooks are called in registration order.
 * Errors in individual hooks are caught and logged — they do not
 * prevent other hooks from running.
 *
 * @param hookName — lifecycle event name
 * @param args     — arguments passed to each hook handler
 */
export async function runHook(hookName: VonoLifecycleHook, ...args: unknown[]): Promise<void> {
  for (const module of registry) {
    const hook = module.hooks?.[hookName]

    if (!hook) continue

    try {
      await hook(...args)
    } catch (err) {
      Logger.error(`[vono] Hook "${hookName}" failed in module "${module.name}"`, {
        error: String(err),
      })
    }
  }
}

/**
 * clearRegistry — resets the module registry.
 * Intended for use in tests only.
 */
export function clearRegistry(): void {
  registry.length = 0
}
