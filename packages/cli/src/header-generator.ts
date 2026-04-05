/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync } from 'node:fs'

/** The canonical header marker — used to detect existing headers */
const HEADER_MARKER = '🏢 Company Name: Bonifade Technologies'

/**
 * Returns today's date as YYYY-MM-DD.
 */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Generates the Bonifade Technologies file header comment string.
 *
 * @param _filePath - reserved for future per-file metadata (unused today)
 */
export function generateHeader(_filePath: string): string {
  const date = today()
  return [
    '/**',
    ' * ──────────────────────────────────────────────────────────────────',
    ' * 🏢 Company Name: Bonifade Technologies',
    ' * 👨‍💻 Developer: Bowofade Oyerinde',
    ' * 🐙 GitHub: oyenet1',
    ` * 📅 Created Date: ${date}`,
    ` * 🔄 Updated Date: ${date}`,
    ' * ──────────────────────────────────────────────────────────────────',
    ' */',
  ].join('\n')
}

/**
 * Returns `true` when the file content already contains the Bonifade header.
 */
export function hasHeader(content: string): boolean {
  return content.includes(HEADER_MARKER)
}

/**
 * Injects the Bonifade header at the top of `content` if it is missing.
 * Preserves all existing content unchanged.
 *
 * @param filePath - path used to generate the header (passed to generateHeader)
 * @param content  - current file content
 * @returns the (possibly modified) file content
 */
export function injectHeader(filePath: string, content: string): string {
  if (hasHeader(content)) return content
  const header = generateHeader(filePath)
  // Preserve a leading shebang line if present
  if (content.startsWith('#!')) {
    const newlineIdx = content.indexOf('\n')
    const shebang = content.slice(0, newlineIdx + 1)
    const rest = content.slice(newlineIdx + 1)
    return `${shebang}${header}\n\n${rest}`
  }
  return `${header}\n\n${content}`
}

/**
 * Reads a file from disk, injects the header if missing, and writes it back.
 * Returns `true` when the file was modified, `false` when it already had a header.
 */
export function fixHeaderInFile(filePath: string): boolean {
  const original = readFileSync(filePath, 'utf8')
  const updated = injectHeader(filePath, original)
  if (updated === original) return false
  writeFileSync(filePath, updated, 'utf8')
  return true
}
