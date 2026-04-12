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
import type { VonosanConfig } from '../types/index.js'

/**
 * Vonosan Vite plugin — the single entry point that wires the entire framework.
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
 * import { vonosan } from 'vonosan/vite'
 * export default defineConfig({ plugins: [vonosan()] })
 * ```
 */
export function vonosan(vonoConfig?: Partial<VonosanConfig>): Plugin[] {
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

  // ── Vonosan core plugin (HMR, config watch, virtual modules) ─────────
  plugins.push(createVonoCorePlugin(vonoConfig))

  return plugins
}

// ─── Dev server plugin ──────────────────────────────────────────────

function createDevServerPlugin(): Plugin {
  return {
    name: 'vonosan:dev-server',
    apply: 'serve',
    async config() {
      const { default: devServer } = await import('@hono/vite-dev-server')
      return {
        plugins: [
          devServer({
            // Use Hono app entry so /api routes are served by Hono in dev.
            entry: './src/app.ts',
            exclude: [
              /.*\.vue($|\?)/,
              /^\/(public|assets|static)\/.+/,
              /.*\.(s?css|less)($|\?)/,
              /.*\.(svg|png|jpg|jpeg|gif|ico|woff2?)($|\?)/,
              /^\/src\/.+/,
            ],
          }) as unknown as Plugin,
        ],
      } satisfies UserConfig
    },
  }
}

// ─── Vue Router plugin ──────────────────────────────────────────────

function createVueRouterPlugin(): Plugin {
  return {
    name: 'vonosan:vue-router',
    async config() {
      const { default: VueRouter } = await import('vue-router/vite')
      return {
        plugins: [
          VueRouter({
            routesFolder: [{ src: 'src/modules' }],
            extensions: ['.page.vue'],
            filePatterns: ['**/*.page'],
            dts: 'src/route-map.d.ts',
          }) as unknown as Plugin,
        ],
      } satisfies UserConfig
    },
  }
}

// ─── Vue plugin ─────────────────────────────────────────────────────

function createVuePlugin(): Plugin {
  return {
    name: 'vonosan:vue',
    async config() {
      const { default: vue } = await import('@vitejs/plugin-vue')
      return {
        plugins: [vue() as unknown as Plugin],
      } satisfies UserConfig
    },
  }
}

// ─── Auto-import plugin ─────────────────────────────────────────────

function createAutoImportPlugin(): Plugin {
  return {
    name: 'vonosan:auto-import',
    async config() {
      const { default: AutoImport } = await import('unplugin-auto-import/vite')
      return {
        plugins: [
          AutoImport({
            dts: 'src/auto-imports.d.ts',
            imports: [
              'vue',
              'vue-router',
              'pinia',
              {
                'hono': ['Hono', 'HTTPException'],
                'drizzle-orm': ['eq', 'and', 'or', 'desc', 'asc', 'isNull', 'isNotNull', 'sql', 'count', 'like', 'inArray'],
                'zod': [['z', 'z']],
                'vonosan/server': ['success', 'error', 'buildPaginationMeta', 'generateId', 'prefixedId', 'toCamel', 'withSoftDeletes', 'onlyTrashed', 'withTrashed', 'Logger'],
                'vonosan/client': ['useAsyncData', 'useVonosanFetch', 'useCookie', 'useState', 'navigateTo', 'useSeo', 'useRouteRules', 'useFormErrors'],
              },
            ],
            dirs: [
              'src/composables/**',
              'src/shared/utils/**',
              'src/shared/middleware/**',
              'src/shared/composables/**',
              'src/modules/**/composables/**',
              'src/lib/**',
            ],
          }) as unknown as Plugin,
        ],
      } satisfies UserConfig
    },
  }
}

// ─── Vue Components plugin ──────────────────────────────────────────

function createVueComponentsPlugin(): Plugin {
  return {
    name: 'vonosan:vue-components',
    async config() {
      const { default: Components } = await import('unplugin-vue-components/vite')
      return {
        plugins: [
          Components({
            dts: 'src/components.d.ts',
            dirs: ['src/components', 'src/shared/components', 'src/modules'],
            extensions: ['vue'],
            deep: true,
          }) as unknown as Plugin,
        ],
      } satisfies UserConfig
    },
  }
}

// ─── Nuxt UI plugin ─────────────────────────────────────────────────

function createNuxtUIPlugin(colors?: { primary: string; neutral: string }): Plugin {
  return {
    name: 'vonosan:nuxt-ui',
    async config() {
      try {
        const { default: ui } = await import('@nuxt/ui/vite')
        return {
          plugins: [ui({ colors }) as unknown as Plugin],
        } satisfies UserConfig
      } catch {
        // @nuxt/ui not installed — skip
        return {}
      }
    },
  }
}

// ─── Vonosan core plugin ───────────────────────────────────────────────

function createVonoCorePlugin(vonoConfig?: Partial<VonosanConfig>): Plugin {
  const runtime = vonoConfig?.runtime ?? 'bun'

  return {
    name: 'vonosan:core',

    // Inject virtual module with route rules and public config
    resolveId(id: string) {
      if (id === 'virtual:vonosan/config') return '\0virtual:vonosan/config'
      if (id === '@@ws-adapter') return resolveWsAdapter(runtime)
      return null
    },

    load(id: string) {
      if (id === '\0virtual:vonosan/config') {
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
    config(config: UserConfig, { command }: { command: 'build' | 'serve' }) {
      if (command === 'build') {
        const buildConfig = config.build as { ssr?: boolean } | undefined
        return {
          build: {
            rollupOptions: {
              input: buildConfig?.ssr ? 'src/server.ts' : 'src/app.ts',
              external: [
                // node-cron is dynamically imported with try/catch in jobs runner
                // Mark as external to prevent bundler resolution failures
                'node-cron',
              ],
            },
          },
          // Externalize server-only packages for SSR builds
          ssr: {
            external: ['node-cron'],
          },
        }
      }
      return {}
    },

    // Hot-reload API route files without full restart
    async handleHotUpdate({ file, server }: { file: string; server: { ssrLoadModule: (id: string) => Promise<unknown>; ws: { send: (payload: { type: string }) => void } } }) {
      if (file.endsWith('.routes.ts')) {
        await server.ssrLoadModule(file)
        server.ws.send({ type: 'full-reload' })
        return []
      }
      return undefined
    },

    // Full restart on vonosan.config.ts changes
    configureServer(server: { watcher: { on: (event: 'change', handler: (file: string) => void) => void }; restart: () => void }) {
      server.watcher.on('change', (file: string) => {
        if (file.endsWith('vonosan.config.ts')) {
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
