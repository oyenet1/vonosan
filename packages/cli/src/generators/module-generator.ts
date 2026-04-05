/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  generateService,
  generateController,
  generateDto,
  generateRoutes,
  generateSchema,
  generateResource,
  generatePolicy,
  generateScopes,
  generatePage,
  generateComposable,
  generateTest,
  generateIntegrationTest,
  generateE2ETest,
  toPascalCase,
} from './file-generators.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModuleGeneratorOptions {
  /** Generate API files (routes, controller, service, dto, schema) */
  api: boolean
  /** Generate frontend files (page, composable) */
  frontend: boolean
  /** SaaS mode — adds deleted_at to schema */
  saas: boolean
}

export interface GeneratedFile {
  path: string
  content: string
}

// ─── Module generator ─────────────────────────────────────────────────────────

/**
 * Generates all module files for `name` according to `options`.
 * Returns the list of files that would be written (does NOT write to disk).
 * Use `writeModule()` to persist them.
 */
export function generateModule(
  name: string,
  options: ModuleGeneratorOptions,
): GeneratedFile[] {
  const files: GeneratedFile[] = []
  const moduleDir = `src/modules/${name}`

  if (options.api) {
    files.push({ path: `${moduleDir}/${name}.routes.ts`, content: generateRoutes(name) })
    files.push({ path: `${moduleDir}/${name}.controller.ts`, content: generateController(name) })
    files.push({ path: `${moduleDir}/${name}.service.ts`, content: generateService(name) })
    files.push({ path: `${moduleDir}/${name}.dto.ts`, content: generateDto(name) })
    files.push({ path: `${moduleDir}/${name}.schema.ts`, content: generateSchema(name, options.saas) })
    files.push({ path: `${moduleDir}/${name}.resource.ts`, content: generateResource(name) })
    files.push({ path: `${moduleDir}/${name}.policy.ts`, content: generatePolicy(name) })
    files.push({ path: `${moduleDir}/${name}.scopes.ts`, content: generateScopes(name) })

    // Tests
    files.push({ path: `${moduleDir}/tests/${name}.unit.test.ts`, content: generateTest(name) })
    files.push({ path: `${moduleDir}/tests/${name}.integration.test.ts`, content: generateIntegrationTest(name) })
    files.push({ path: `${moduleDir}/tests/${name}.e2e.test.ts`, content: generateE2ETest(name) })
  }

  if (options.frontend) {
    files.push({ path: `${moduleDir}/index.page.vue`, content: generatePage(name) })
    files.push({
      path: `${moduleDir}/composables/use${toPascalCase(name)}.ts`,
      content: generateComposable(name),
    })
  }

  return files
}

/**
 * Writes all generated files to disk.
 * Throws if the module directory already exists (prevents overwriting).
 */
export function writeModule(
  name: string,
  files: GeneratedFile[],
  projectRoot = process.cwd(),
): void {
  const moduleDir = join(projectRoot, 'src', 'modules', name)

  if (existsSync(moduleDir)) {
    throw new Error(
      `Module "${name}" already exists at ${moduleDir}. Remove it first or choose a different name.`,
    )
  }

  for (const { path: filePath, content } of files) {
    const absPath = join(projectRoot, filePath)
    const dir = absPath.substring(0, absPath.lastIndexOf('/'))
    mkdirSync(dir, { recursive: true })
    writeFileSync(absPath, content, 'utf8')
  }
}
