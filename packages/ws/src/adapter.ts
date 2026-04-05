/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { Logger } from 'vono/server'

// ─── Types ───────────────────────────────────────────────────────────────────

export type WsRuntime = 'bun' | 'node' | 'cloudflare-workers' | 'deno'

export interface WsAdapterInfo {
  /** Import path for the WebSocket adapter */
  importPath: string
  /** Whether Socket.IO is supported on this runtime */
  supportsSocketIo: boolean
  /** Warning message for unsupported features */
  warning?: string
}

// ─── Adapter resolution ───────────────────────────────────────────────────────

/**
 * `resolveWsAdapter(runtime)` — returns the correct WebSocket adapter import
 * path for the given deployment runtime.
 *
 * | Runtime             | Import path                      |
 * |---------------------|----------------------------------|
 * | bun                 | hono/bun                         |
 * | node                | @hono/node-ws                    |
 * | cloudflare-workers  | hono/cloudflare-workers          |
 * | deno                | hono/deno                        |
 *
 * @example
 * const { importPath } = resolveWsAdapter('bun')
 * const { createNodeWebSocket } = await import(importPath)
 */
export function resolveWsAdapter(runtime: string): WsAdapterInfo {
  switch (runtime) {
    case 'bun':
      return {
        importPath: 'hono/bun',
        supportsSocketIo: true,
      }

    case 'node':
      return {
        importPath: '@hono/node-ws',
        supportsSocketIo: true,
      }

    case 'cloudflare-workers':
    case 'cloudflare-pages': {
      const info: WsAdapterInfo = {
        importPath: 'hono/cloudflare-workers',
        supportsSocketIo: false,
        warning:
          '[ws] Socket.IO is not supported on Cloudflare Workers. ' +
          'Use native WebSocket via Durable Objects instead.',
      }
      Logger.warn(info.warning!)
      return info
    }

    case 'deno':
      return {
        importPath: 'hono/deno',
        supportsSocketIo: false,
        warning: '[ws] Socket.IO is not supported on Deno. Use native WebSocket.',
      }

    case 'vercel':
    case 'netlify':
    case 'aws-lambda':
    case 'fastly': {
      const info: WsAdapterInfo = {
        importPath: '',
        supportsSocketIo: false,
        warning:
          `[ws] WebSocket / Socket.IO is not supported on serverless target "${runtime}". ` +
          'Use a dedicated WebSocket service (e.g. Ably, Pusher) instead.',
      }
      Logger.warn(info.warning!)
      return info
    }

    default:
      Logger.warn('[ws] Unknown runtime, defaulting to node adapter', { runtime })
      return {
        importPath: '@hono/node-ws',
        supportsSocketIo: true,
      }
  }
}
