/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { UserConfig } from 'vite'
import type { VonosanModuleDefinition } from './define-module.js'
import { Logger } from '../shared/utils/logger.js'

// ─── applyModulesToViteConfig ────────────────────────────────────────

/**
 * applyModulesToViteConfig — merges module schemas, routes,
 * auto-imports, and pages into the Vite config at build time.
 *
 * Called by the Vonosan Vite plugin when building the project.
 *
 * @param modules — registered VonosanModuleDefinition array
 * @param config  — existing Vite UserConfig to merge into
 * @returns merged Vite config
 */
export function applyModulesToViteConfig(
  modules: VonosanModuleDefinition[],
  config: UserConfig,
): UserConfig {
  const merged: UserConfig = { ...config }
  const getDefineEntries = (): Record<string, string> =>
    typeof merged.define === 'object' && merged.define !== null
      ? merged.define as Record<string, string>
      : {}

  // Collect all server-side auto-imports from modules
  const serverImports: Array<{ from: string; imports: string[] }> = []
  const clientImports: Array<{ from: string; imports: string[] }> = []

  for (const module of modules) {
    if (module.serverImports?.length) {
      serverImports.push(...module.serverImports)
      Logger.info(`[vonosan] Merging server imports from module: ${module.name}`)
    }

    if (module.clientImports?.length) {
      clientImports.push(...module.clientImports)
      Logger.info(`[vonosan] Merging client imports from module: ${module.name}`)
    }
  }

  // Merge into Vite config via the resolve.alias or plugin options
  // The actual unplugin-auto-import config is handled by the Vonosan Vite plugin;
  // here we attach the collected imports as metadata for the plugin to consume.
  if (serverImports.length > 0 || clientImports.length > 0) {
    merged.define = {
      ...getDefineEntries(),
      '__VONO_MODULE_SERVER_IMPORTS__': JSON.stringify(serverImports),
      '__VONO_MODULE_CLIENT_IMPORTS__': JSON.stringify(clientImports),
    }
  }

  // Collect page routes from modules
  const modulePages = modules.flatMap((m) => m.pages ?? [])
  if (modulePages.length > 0) {
    merged.define = {
      ...getDefineEntries(),
      '__VONO_MODULE_PAGES__': JSON.stringify(modulePages),
    }
    Logger.info(`[vonosan] Registered ${modulePages.length} page(s) from modules`)
  }

  // Collect API routes from modules
  const moduleRoutes = modules.flatMap((m) => m.routes ?? [])
  if (moduleRoutes.length > 0) {
    merged.define = {
      ...getDefineEntries(),
      '__VONO_MODULE_ROUTES__': JSON.stringify(moduleRoutes),
    }
    Logger.info(`[vonosan] Registered ${moduleRoutes.length} route(s) from modules`)
  }

  return merged
}
