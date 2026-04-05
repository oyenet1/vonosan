/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { Logger } from '../../shared/utils/logger.js'

/**
 * appendModuleTag — reads src/openapi.ts, appends a new tag entry
 * for the given module, and writes the file back.
 *
 * Idempotent: skips if the tag already exists.
 *
 * @param specPath   — path to src/openapi.ts (relative to cwd)
 * @param moduleName — module name, e.g. 'products'
 * @param description — optional tag description
 */
export function appendModuleTag(
  specPath: string,
  moduleName: string,
  description?: string,
): void {
  if (!existsSync(specPath)) {
    Logger.warn(`[openapi] spec file not found: ${specPath}`)
    return
  }

  const content = readFileSync(specPath, 'utf8')

  // Derive tag name: 'products' → 'Products'
  const tagName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)
  const tagDescription = description ?? `${tagName} module endpoints`

  // Idempotency check
  if (content.includes(`name: '${tagName}'`) || content.includes(`name: "${tagName}"`)) {
    Logger.info(`[openapi] tag "${tagName}" already exists in ${specPath} — skipping`)
    return
  }

  // Find the tags array and append the new entry before the closing bracket
  // Pattern: looks for the last entry in the tags array
  const tagEntry = `      { name: '${tagName}', description: '${tagDescription}' },`

  // Strategy: insert before the closing `]` of the tags array
  // We look for the pattern `tags: [` and find its closing `]`
  const tagsMatch = content.match(/tags:\s*\[([^\]]*)\]/s)

  if (!tagsMatch) {
    Logger.warn(`[openapi] could not locate tags array in ${specPath}`)
    return
  }

  const updated = content.replace(
    /tags:\s*\[([^\]]*)\]/s,
    (match, inner) => {
      const trimmed = inner.trimEnd()
      const separator = trimmed.endsWith(',') ? '\n' : ',\n'
      return `tags: [${trimmed}${separator}${tagEntry}\n    ]`
    },
  )

  writeFileSync(specPath, updated, 'utf8')
  Logger.info(`[openapi] appended tag "${tagName}" to ${specPath}`)
}
