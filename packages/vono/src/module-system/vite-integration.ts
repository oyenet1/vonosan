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
import type { VonoModuleDefinition } from './define-module.js'
import { Logger } from '../shared/utils/logger.js'

// ─── applyModulesToViteConfig ────────────────────────────────────────

/**
 * applyModulesToViteConfig — merges module schemas, routes,
 * auto-imports, and pages into the Vite config at build time.
 *
 * Called by the Vono Vite plugin when building the project.
 *
 * @param modules — registered VonoModuleDefinition array
 * @param config  — existing Vite UserConfig to merge into
 * @returns merged Vite config
 */
export function applyModulesToViteConfig(
  modules: VonoModuleDefinition[],
  config: UserConfig,
): UserConfig {
  const merged: UserConfig = { ...config }

  // Collect all server-side auto-imports from modules
  const serverImports: Array<{ from: string; imports: string[] }> = []
  const clientImports: Array<{ from: string; imports: string[] }> = []

  for (const module of modules) {
    if (module.serverImports?.length) {
      serverImports.push(...module.serverImports)
      Logger.info(`[vono] Merging server imports from module: ${module.name}`)
    }

    if (module.clientImports?.length) {
      clientImports.push(...module.clientImports)
      Logger.info(`[vono] Merging client imports from module: ${module.name}`)
    }
  }

  // Merge into Vite config via the resolve.alias or plugin options
  // The actual unplugin-auto-import config is handled by the Vono Vite plugin;
  // here we attach the collected imports as metadata for the plugin to consume.
  if (serverImports.length > 0 || clientImports.length > 0) {
    merged.define = {
      ...merged.define,
      '__VONO_MODULE_SERVER_IMPORTS__': JSON.stringify(serverImports),
      '__VONO_MODULE_CLIENT_IMPORTS__': JSON.stringify(clientImports),
    }
  }

  // Collect page routes from modules
  const modulePages = modules.flatMap((m) => m.pages ?? [])
  if (modulePages.length > 0) {
    merged.define = {
      ...merged.define,
      '__VONO_MODULE_PAGES__': JSON.stringify(modulePages),
    }
    Logger.info(`[vono] Registered ${modulePages.length} page(s) from modules`)
  }

  // Collect API routes from modules
  const moduleRoutes = modules.flatMap((m) => m.routes ?? [])
  if (moduleRoutes.length > 0) {
    merged.define = {
      ...merged.define,
      '__VONO_MODULE_ROUTES__': JSON.stringify(moduleRoutes),
    }
    Logger.info(`[vono] Registered ${moduleRoutes.length} route(s) from modules`)
  }

  return merged
}
