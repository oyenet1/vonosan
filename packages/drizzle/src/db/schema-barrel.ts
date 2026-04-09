/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { readdir, writeFile, access } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

// ─── Types ──────────────────────────────────────────────────────────

export interface SchemaBarrelOptions {
  /**
   * Root directory to scan for *.schema.ts files.
   * Defaults to `src/modules` relative to cwd.
   */
  modulesDir?: string

  /**
   * Output path for the generated barrel file.
   * Defaults to `src/db/schema.ts` relative to cwd.
   */
  outputPath?: string

  /**
   * Whether to include the relations file in the barrel.
   * Defaults to true.
   */
  includeRelations?: boolean
}

// ─── Generator ──────────────────────────────────────────────────────

/**
 * generateSchemaBarrel — scan `src/modules/**\/*.schema.ts` files and
 * write a `src/db/schema.ts` barrel that re-exports all schemas.
 *
 * This is called by `vono schema:sync` and `vono migrate:make`.
 *
 * Usage:
 * ```ts
 * import { generateSchemaBarrel } from '@vonosan/drizzle'
 * await generateSchemaBarrel({ modulesDir: 'src/modules', outputPath: 'src/db/schema.ts' })
 * ```
 */
export async function generateSchemaBarrel(options: SchemaBarrelOptions = {}): Promise<void> {
  const cwd = process.cwd()
  const modulesDir = resolve(cwd, options.modulesDir ?? 'src/modules')
  const outputPath = resolve(cwd, options.outputPath ?? 'src/db/schema.ts')
  const includeRelations = options.includeRelations ?? true

  // Discover all *.schema.ts files recursively
  const schemaFiles = await findSchemaFiles(modulesDir)

  if (schemaFiles.length === 0 && !includeRelations) {
    // Nothing to generate
    return
  }

  // Build the barrel content
  const lines: string[] = [
    '/**',
    ' * ──────────────────────────────────────────────────────────────────',
    ' * 🏢 Company Name: Bonifade Technologies',
    ' * 👨‍💻 Developer: Bowofade Oyerinde',
    ' * 🐙 GitHub: oyenet1',
    ' * 📅 Created Date: ' + new Date().toISOString().slice(0, 10),
    ' * 🔄 Updated Date: ' + new Date().toISOString().slice(0, 10),
    ' * ──────────────────────────────────────────────────────────────────',
    ' */',
    '',
    '/**',
    ' * src/db/schema.ts — auto-generated schema barrel.',
    ' * DO NOT EDIT MANUALLY — run `vono schema:sync` to regenerate.',
    ' */',
    '',
  ]

  // Export each schema file
  for (const file of schemaFiles) {
    // Convert absolute path to relative import path from the output file's directory
    const outputDir = resolve(outputPath, '..')
    const relPath = relative(outputDir, file)
      .replace(/\\/g, '/')
      .replace(/\.ts$/, '.js')

    const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`
    lines.push(`export * from '${importPath}'`)
  }

  // Include relations
  if (includeRelations) {
    const relationsPath = resolve(cwd, 'src/db/relations.ts')
    const relationsExists = await fileExists(relationsPath)
    if (relationsExists) {
      lines.push(`export * from './relations.js'`)
    }
  }

  lines.push('')

  await writeFile(outputPath, lines.join('\n'), 'utf-8')
}

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Recursively find all *.schema.ts files under a directory.
 */
async function findSchemaFiles(dir: string): Promise<string[]> {
  const results: string[] = []

  let entries: Awaited<ReturnType<typeof readdir>>
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    // Directory doesn't exist yet — return empty
    return results
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await findSchemaFiles(fullPath)
      results.push(...nested)
    } else if (entry.isFile() && entry.name.endsWith('.schema.ts')) {
      results.push(fullPath)
    }
  }

  return results.sort()
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
