/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

/**
 * Structured logger — replaces raw console.* calls.
 *
 * Usage:
 *   import { Logger } from 'vono/server'
 *   Logger.info('User created', { userId: '123' })
 *   Logger.error('DB connection failed', { error: err.message })
 */
export class Logger {
  private static format(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context ? { context } : {}),
    }
  }

  private static write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry = Logger.format(level, message, context)
    const output = JSON.stringify(entry)

    // Use the underlying console methods — this is the ONE place in the
    // codebase where console.* is allowed (the logger itself).
    // All other code must use Logger instead.
    switch (level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(output)
        break
      case 'info':
        // eslint-disable-next-line no-console
        console.info(output)
        break
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(output)
        break
      case 'error':
        // eslint-disable-next-line no-console
        console.error(output)
        break
    }
  }

  static debug(message: string, context?: Record<string, unknown>): void {
    Logger.write('debug', message, context)
  }

  static info(message: string, context?: Record<string, unknown>): void {
    Logger.write('info', message, context)
  }

  static warn(message: string, context?: Record<string, unknown>): void {
    Logger.write('warn', message, context)
  }

  static error(message: string, context?: Record<string, unknown>): void {
    Logger.write('error', message, context)
  }
}
