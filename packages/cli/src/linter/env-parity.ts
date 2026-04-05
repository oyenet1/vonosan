/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface EnvParityResult {
  /** Keys present in .env but missing from .env.example */
  missingInExample: string[]
  /** Keys present in .env.example but missing from .env */
  missingInEnv: string[]
}

/**
 * Parses an env file and returns the set of defined keys.
 * Ignores blank lines and comment lines (starting with #).
 */
export function parseEnvKeys(content: string): Set<string> {
  const keys = new Set<string>()
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    if (key) keys.add(key)
  }
  return keys
}

/**
 * Compares `.env` and `.env.example` keys in `projectRoot`.
 *
 * Returns lists of keys missing from each file.
 * If `.env` does not exist, returns empty lists (no error — per Requirement 8.4).
 */
export function checkEnvParity(projectRoot: string): EnvParityResult {
  const envPath = join(projectRoot, '.env')
  const examplePath = join(projectRoot, '.env.example')

  if (!existsSync(envPath)) {
    return { missingInExample: [], missingInEnv: [] }
  }

  const envKeys = parseEnvKeys(readFileSync(envPath, 'utf8'))
  const exampleKeys = existsSync(examplePath)
    ? parseEnvKeys(readFileSync(examplePath, 'utf8'))
    : new Set<string>()

  const missingInExample: string[] = []
  const missingInEnv: string[] = []

  for (const key of envKeys) {
    if (!exampleKeys.has(key)) missingInExample.push(key)
  }
  for (const key of exampleKeys) {
    if (!envKeys.has(key)) missingInEnv.push(key)
  }

  return { missingInExample, missingInEnv }
}
