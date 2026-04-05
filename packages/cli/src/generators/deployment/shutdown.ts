/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

/**
 * generateGracefulShutdown — returns a SIGINT handler code snippet.
 *
 * Closes DB connections and queue connections before exiting.
 * Inject this into the generated src/server.ts or src/index.ts.
 */
export function generateGracefulShutdown(): string {
  return `/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: ${new Date().toISOString().slice(0, 10)}
 * 🔄 Updated Date: ${new Date().toISOString().slice(0, 10)}
 * ──────────────────────────────────────────────────────────────────
 */

import { Logger } from 'vono/server'

// ─── Graceful shutdown ───────────────────────────────────────────────

/**
 * Registers a SIGINT handler that closes all open connections
 * before the process exits.
 *
 * Call this once at the top of your server entry file.
 */
export function registerGracefulShutdown(options?: {
  /** Called before process.exit — close DB, queue, etc. */
  onShutdown?: () => Promise<void>
}): void {
  const shutdown = async (signal: string) => {
    Logger.info(\`[vono] Received \${signal} — shutting down gracefully...\`)

    try {
      if (options?.onShutdown) {
        await options.onShutdown()
      }
      Logger.info('[vono] Shutdown complete.')
    } catch (err) {
      Logger.error('[vono] Error during shutdown', { error: String(err) })
    } finally {
      process.exit(0)
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}
`
}
