/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import fg from 'fast-glob'
import { hasHeader } from './header-generator.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LintRule =
  | 'header-missing'
  | 'console-log'
  | 'naming-snake-case-response'
  | 'versioning-missing-prefix'
  | 'dry-violation'

export interface LintResult {
  file: string
  line: number
  rule: LintRule
  message: string
}

// ─── Individual rule checkers ─────────────────────────────────────────────────

/**
 * Rule: every .ts / .vue file must start with the Bonifade header.
 */
function checkHeader(filePath: string, content: string): LintResult[] {
  if (hasHeader(content)) return []
  return [
    {
      file: filePath,
      line: 1,
      rule: 'header-missing',
      message: `Missing Bonifade Technologies file header. Run \`vono fix:headers\` to auto-fix.`,
    },
  ]
}

/**
 * Rule: no raw console.log / console.warn / console.error / console.debug.
 * Files containing `// @vono-ignore-logs` are skipped entirely.
 */
function checkConsoleLogs(filePath: string, content: string): LintResult[] {
  if (content.includes('// @vono-ignore-logs')) return []

  const results: LintResult[] = []
  const lines = content.split('\n')
  const consoleRe = /\bconsole\.(log|warn|error|debug|info)\s*\(/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Skip the logger.ts file itself — it is the ONE allowed place
    if (filePath.includes('logger.ts')) continue
    if (consoleRe.test(line)) {
      const match = line.match(consoleRe)!
      results.push({
        file: filePath,
        line: i + 1,
        rule: 'console-log',
        message: `Raw \`console.${match[1]}()\` detected. Use \`Logger.${match[1]}()\` from vonosan/server instead.`,
      })
    }
  }
  return results
}

/**
 * Rule: API response objects must not contain snake_case keys.
 * Heuristic: looks for `{ some_key:` patterns inside return statements in
 * controller / service files.
 */
function checkNamingConventions(filePath: string, content: string): LintResult[] {
  // Only check controller / service files
  if (!filePath.match(/\.(controller|service)\.ts$/)) return []

  const results: LintResult[] = []
  const lines = content.split('\n')
  // Matches object literal keys that are snake_case (contain underscore)
  const snakeCaseKeyRe = /\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\s*:/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(snakeCaseKeyRe)
    if (match) {
      results.push({
        file: filePath,
        line: i + 1,
        rule: 'naming-snake-case-response',
        message: `API response key \`${match[1]}\` uses snake_case. Convert to camelCase using \`toCamel()\`.`,
      })
    }
  }
  return results
}

/**
 * Rule: all routes must be nested under a versioned prefix like /api/v1/.
 * Only checks *.routes.ts files.
 */
function checkVersioning(filePath: string, content: string): LintResult[] {
  if (!filePath.endsWith('.routes.ts')) return []

  const results: LintResult[] = []
  const lines = content.split('\n')
  // Matches route definitions that start with a path not under /api/v<n>
  // e.g. app.get('/users', ...) — missing /api/v1 prefix
  const routeDefRe = /\.(get|post|put|patch|delete|all)\s*\(\s*['"`](\/[^'"`]*)/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(routeDefRe)
    if (match) {
      const path = match[2]
      if (!path.match(/^\/api\/v\d+/)) {
        results.push({
          file: filePath,
          line: i + 1,
          rule: 'versioning-missing-prefix',
          message: `Route \`${path}\` is not nested under a versioned prefix (e.g. /api/v1/). All routes must be versioned.`,
        })
      }
    }
  }
  return results
}

// ─── DRY violation detector ───────────────────────────────────────────────────

/**
 * Extracts function bodies from a TypeScript file.
 * Returns a map of normalised body → list of { file, line }.
 */
function extractFunctionBodies(filePath: string, content: string): Map<string, number> {
  const bodies = new Map<string, number>()
  const lines = content.split('\n')

  // Simple heuristic: find `function` or arrow function declarations and
  // capture the block body between matching braces.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/\bfunction\b|\=\s*\(.*\)\s*=>/.test(line) && line.includes('{')) {
      // Collect body until matching closing brace
      let depth = 0
      let body = ''
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') depth++
          else if (ch === '}') depth--
        }
        body += lines[j] + '\n'
        if (depth === 0 && j > i) break
      }
      // Normalise whitespace for comparison
      const normalised = body.replace(/\s+/g, ' ').trim()
      if (normalised.length > 40) {
        // Only flag non-trivial bodies
        bodies.set(normalised, i + 1)
      }
    }
  }
  return bodies
}

/**
 * Rule: identical function bodies in 2+ module files = DRY violation.
 */
function checkDryViolations(
  files: Array<{ path: string; content: string }>,
): LintResult[] {
  // Map: normalised body → list of { file, line }
  const bodyMap = new Map<string, Array<{ file: string; line: number }>>()

  for (const { path: filePath, content } of files) {
    // Only check module files
    if (!filePath.includes('/modules/')) continue
    const bodies = extractFunctionBodies(filePath, content)
    for (const [body, line] of bodies) {
      const existing = bodyMap.get(body) ?? []
      existing.push({ file: filePath, line })
      bodyMap.set(body, existing)
    }
  }

  const results: LintResult[] = []
  for (const [, occurrences] of bodyMap) {
    if (occurrences.length >= 2) {
      for (const { file, line } of occurrences) {
        results.push({
          file,
          line,
          rule: 'dry-violation',
          message: `Identical function body found in ${occurrences.length} files. Extract to a shared utility in src/shared/utils/.`,
        })
      }
    }
  }
  return results
}

// ─── Main linter entry point ──────────────────────────────────────────────────

/**
 * Scans all `.ts` and `.vue` files under `srcDir` and returns all lint violations.
 *
 * @param srcDir - absolute or relative path to the project's `src/` directory
 */
export async function lintProject(srcDir: string): Promise<LintResult[]> {
  const pattern = join(srcDir, '**/*.{ts,vue}').replace(/\\/g, '/')
  const filePaths = await fg(pattern, { absolute: true, ignore: ['**/node_modules/**', '**/dist/**'] })

  const fileContents: Array<{ path: string; content: string }> = []

  for (const filePath of filePaths) {
    const content = readFileSync(filePath, 'utf8')
    fileContents.push({ path: relative(process.cwd(), filePath), content })
  }

  const results: LintResult[] = []

  for (const { path: filePath, content } of fileContents) {
    results.push(...checkHeader(filePath, content))
    results.push(...checkConsoleLogs(filePath, content))
    results.push(...checkNamingConventions(filePath, content))
    results.push(...checkVersioning(filePath, content))
  }

  // DRY check needs all files at once
  results.push(...checkDryViolations(fileContents))

  return results
}
