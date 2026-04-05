/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { Plugin, UserConfig } from 'vite'
import type { VonoConfig } from '../types/index.js'

/**
 * Vono Vite plugin — the single entry point that wires the entire framework.
 *
 * Composes internally:
 * - @vitejs/plugin-vue
 * - vue-router/vite (file-based routing from src/modules/**\/*.page.vue)
 * - unplugin-auto-import/vite
 * - unplugin-vue-components/vite
 * - @hono/vite-dev-server
 * - @nuxt/ui/vite
 *
 * Usage in vite.config.ts:
 * ```ts
 * import { vono } from 'vono/vite'
 * export default defineConfig({ plugins: [vono()] })
 * ```
 */
export function vono(vonoConfig?: Partial<VonoConfig>): Plugin[] {
  const plugins: Plugin[] = []

  // ── @hono/vite-dev-server ─────────────────────────────────────────
  plugins.push(createDevServerPlugin())

  // ── vue-router/vite (MUST come before Vue plugin) ─────────────────
  plugins.push(createVueRouterPlugin())

  // ── @vitejs/plugin-vue ────────────────────────────────────────────
  plugins.push(createVuePlugin())

  // ── unplugin-auto-import ──────────────────────────────────────────
  plugins.push(createAutoImportPlugin())

  // ── unplugin-vue-components ───────────────────────────────────────
  plugins.push(createVueComponentsPlugin())

  // ── @nuxt/ui/vite ─────────────────────────────────────────────────
  plugins.push(createNuxtUIPlugin(vonoConfig?.ui?.colors))

  // ── Vono core plugin (HMR, config watch, virtual modules) ─────────
  plugins.push(createVonoCorePlugin(vonoConfig))

  return plugins
}

// ─── Dev server plugin ──────────────────────────────────────────────

function createDevServerPlugin(): Plugin {
  return {
    name: 'vono:dev-server',
    apply: 'serve',
    async config() {
      const { default: devServer } = await import('@hono/vite-dev-server')
      return devServer({
        entry: './index.ts',
        exclude: [
          /.*\.vue($|\?)/,
          /^\/(public|assets|static)\/.+/,
          /.*\.(s?css|less)($|\?)/,
          /.*\.(svg|png|jpg|jpeg|gif|ico|woff2?)($|\?)/,
          /^\/src\/.+/,
        ],
      }) as unknown as UserConfig
    },
  }
}

// ─── Vue Router plugin ──────────────────────────────────────────────

function createVueRouterPlugin(): Plugin {
  return {
    name: 'vono:vue-router',
    async config() {
      const { default: VueRouter } = await import('vue-router/vite')
      return VueRouter({
        routesFolder: [{ src: 'src/modules' }],
        extensions: ['.page.vue'],
        filePatterns: ['**/*.page'],
        dts: 'src/route-map.d.ts',
      }) as unknown as UserConfig
    },
  }
}

// ─── Vue plugin ─────────────────────────────────────────────────────

function createVuePlugin(): Plugin {
  return {
    name: 'vono:vue',
    async config() {
      const { default: vue } = await import('@vitejs/plugin-vue')
      return vue() as unknown as UserConfig
    },
  }
}

// ─── Auto-import plugin ─────────────────────────────────────────────

function createAutoImportPlugin(): Plugin {
  return {
    name: 'vono:auto-import',
    async config() {
      const { default: AutoImport } = await import('unplugin-auto-import/vite')
      return AutoImport({
        dts: 'src/auto-imports.d.ts',
        imports: [
          'vue',
          'vue-router',
          'pinia',
          {
            'hono': ['Hono', 'HTTPException'],
            'drizzle-orm': ['eq', 'and', 'or', 'desc', 'asc', 'isNull', 'isNotNull', 'sql', 'count', 'like', 'inArray'],
            'zod': [['z', 'z']],
            'vono/server': ['success', 'error', 'buildPaginationMeta', 'generateId', 'prefixedId', 'toCamel', 'withSoftDeletes', 'onlyTrashed', 'withTrashed', 'Logger'],
            'vono/client': ['useAsyncData', 'useVonoFetch', 'useCookie', 'useState', 'navigateTo', 'useSeo', 'useRouteRules', 'useFormErrors'],
          },
        ],
        dirs: [
          'src/shared/utils/**',
          'src/shared/middleware/**',
          'src/shared/composables/**',
          'src/lib/**',
        ],
      }) as unknown as UserConfig
    },
  }
}

// ─── Vue Components plugin ──────────────────────────────────────────

function createVueComponentsPlugin(): Plugin {
  return {
    name: 'vono:vue-components',
    async config() {
      const { default: Components } = await import('unplugin-vue-components/vite')
      return Components({
        dts: 'src/components.d.ts',
        dirs: ['src/shared/components', 'src/modules'],
        extensions: ['vue'],
        deep: true,
      }) as unknown as UserConfig
    },
  }
}

// ─── Nuxt UI plugin ─────────────────────────────────────────────────

function createNuxtUIPlugin(colors?: { primary: string; neutral: string }): Plugin {
  return {
    name: 'vono:nuxt-ui',
    async config() {
      try {
        const { default: ui } = await import('@nuxt/ui/vite')
        return ui({ colors }) as unknown as UserConfig
      } catch {
        // @nuxt/ui not installed — skip
        return {}
      }
    },
  }
}

// ─── Vono core plugin ───────────────────────────────────────────────

function createVonoCorePlugin(vonoConfig?: Partial<VonoConfig>): Plugin {
  const runtime = vonoConfig?.runtime ?? 'bun'

  return {
    name: 'vono:core',

    // Inject virtual module with route rules and public config
    resolveId(id) {
      if (id === 'virtual:vono/config') return '\0virtual:vono/config'
      if (id === '@@ws-adapter') return resolveWsAdapter(runtime)
      return null
    },

    load(id) {
      if (id === '\0virtual:vono/config') {
        return `export const vonoConfig = ${JSON.stringify({
          app: vonoConfig?.app,
          mode: vonoConfig?.mode,
          runtime: vonoConfig?.runtime,
          ui: vonoConfig?.ui,
        })}`
      }
      return null
    },

    // Dual build: client + server
    config(config, { command }) {
      if (command === 'build') {
        return {
          build: {
            rollupOptions: {
              input: config.build?.ssr ? 'src/server.ts' : 'src/app.ts',
            },
          },
        }
      }
      return {}
    },

    // Hot-reload API route files without full restart
    async handleHotUpdate({ file, server }) {
      if (file.endsWith('.routes.ts')) {
        await server.ssrLoadModule(file)
        server.ws.send({ type: 'full-reload' })
        return []
      }
      return undefined
    },

    // Full restart on vono.config.ts changes
    configureServer(server) {
      server.watcher.on('change', (file) => {
        if (file.endsWith('vono.config.ts')) {
          server.restart()
        }
      })
    },
  }
}

// ─── WebSocket adapter resolution ───────────────────────────────────

function resolveWsAdapter(runtime: string): string {
  const adapterMap: Record<string, string> = {
    'bun': 'hono/bun',
    'node': '@hono/node-ws',
    'cloudflare-workers': 'hono/cloudflare-workers',
    'cloudflare-pages': 'hono/cloudflare-workers',
    'deno': 'hono/deno',
  }
  return adapterMap[runtime] ?? 'hono/bun'
}
