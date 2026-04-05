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
import { generateModule, writeModule } from '../generators/module-generator.js'
import {
  generateService,
  generateController,
  generateDto,
  generateRoutes,
  generateSchema,
  generateMiddleware,
  generatePage,
  generateComponent,
  generateComposable,
  generateStore,
  generateMigration,
  generateSeed,
  generateTest,
  generateNotification,
  generateResource,
  generatePolicy,
  generateJob,
  generateEmail,
  generateHelper,
  toPascalCase,
} from '../generators/file-generators.js'

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function writeFile(relPath: string, content: string): void {
  const absPath = join(process.cwd(), relPath)
  if (existsSync(absPath)) {
    process.stderr.write(red(`File already exists: ${relPath} — skipping.\n`))
    return
  }
  const dir = absPath.substring(0, absPath.lastIndexOf('/'))
  mkdirSync(dir, { recursive: true })
  writeFileSync(absPath, content, 'utf8')
  process.stdout.write(green(`  + ${relPath}\n`))
}

function requireName(args: string[], usage: string): string {
  const [name] = args
  if (!name) {
    process.stderr.write(red(`Usage: ${usage}\n`))
    process.exit(1)
  }
  return name
}

// ─── make:module ─────────────────────────────────────────────────────────────

export async function runMakeModule(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:module <name>')
  const api = !args.includes('--no-api')
  const frontend = args.includes('--frontend') || args.includes('--full-stack')
  const saas = args.includes('--saas')

  process.stdout.write(bold(`Generating module "${name}" …\n`))

  const files = generateModule(name, { api, frontend, saas })

  try {
    writeModule(name, files)
  } catch (err) {
    process.stderr.write(red(String(err) + '\n'))
    process.exit(1)
  }

  process.stdout.write(green(`\n✔ Module "${name}" generated with ${files.length} files.\n`))
}

// ─── make:version ────────────────────────────────────────────────────────────

export async function runMakeVersion(args: string[]): Promise<void> {
  const version = requireName(args, 'vono make:version <v>')
  const versionDir = `src/api/${version}`

  process.stdout.write(bold(`Generating API version namespace "${version}" …\n`))

  const header = `/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: ${new Date().toISOString().slice(0, 10)}
 * 🔄 Updated Date: ${new Date().toISOString().slice(0, 10)}
 * ──────────────────────────────────────────────────────────────────
 */`

  writeFile(
    `${versionDir}/index.ts`,
    `${header}

import { Hono } from 'hono'
import type { AppVariables } from 'vono/types'
import { autoRegisterRoutes } from 'vono/server'

/**
 * API ${version} router.
 * Add feature module routes here or use autoRegisterRoutes().
 */
const ${version}Router = new Hono<{ Variables: AppVariables }>()

autoRegisterRoutes(${version}Router)

export default ${version}Router
`,
  )

  process.stdout.write(green(`\n✔ API version "${version}" namespace created.\n`))
  process.stdout.write(`  Mount it in src/app.ts: app.route('/api/${version}', ${version}Router)\n`)
}

// ─── Individual make:* commands ───────────────────────────────────────────────

export async function runMakeService(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:service <name>')
  writeFile(`src/modules/${name}/${name}.service.ts`, generateService(name))
}

export async function runMakeController(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:controller <name>')
  writeFile(`src/modules/${name}/${name}.controller.ts`, generateController(name))
}

export async function runMakeDto(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:dto <name>')
  writeFile(`src/modules/${name}/${name}.dto.ts`, generateDto(name))
}

export async function runMakeRoutes(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:routes <name>')
  writeFile(`src/modules/${name}/${name}.routes.ts`, generateRoutes(name))
}

export async function runMakeSchema(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:schema <name>')
  const saas = args.includes('--saas')
  writeFile(`src/modules/${name}/${name}.schema.ts`, generateSchema(name, saas))
}

export async function runMakeMiddleware(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:middleware <name>')
  writeFile(`src/modules/${name}/${name}.middleware.ts`, generateMiddleware(name))
}

export async function runMakePage(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:page <module/PageName>')
  // Support "module/PageName" or just "name"
  const parts = name.split('/')
  const moduleName = parts.length > 1 ? parts[0] : name
  const pageName = parts.length > 1 ? parts[1] : 'index'
  writeFile(`src/modules/${moduleName}/${pageName}.page.vue`, generatePage(moduleName))
}

export async function runMakeComponent(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:component <module/ComponentName>')
  const parts = name.split('/')
  const moduleName = parts.length > 1 ? parts[0] : name
  const componentName = parts.length > 1 ? parts[1] : toPascalCase(name)
  writeFile(
    `src/modules/${moduleName}/components/${componentName}.vue`,
    generateComponent(moduleName),
  )
}

export async function runMakeComposable(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:composable <module/useComposable>')
  const parts = name.split('/')
  const moduleName = parts.length > 1 ? parts[0] : name
  const composableName = parts.length > 1 ? parts[1] : `use${toPascalCase(name)}`
  writeFile(
    `src/modules/${moduleName}/composables/${composableName}.ts`,
    generateComposable(moduleName),
  )
}

export async function runMakeStore(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:store <name>')
  writeFile(`src/modules/${name}/stores/${name}.store.ts`, generateStore(name))
}

export async function runMakeMigration(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:migration <name>')
  const timestamp = Date.now()
  writeFile(`src/db/migrations/${timestamp}_${name}.sql`, generateMigration(name))
}

export async function runMakeSeed(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:seed <name>')
  writeFile(`src/db/seeds/${name}.ts`, generateSeed(name))
}

export async function runMakeTest(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:test <name>')
  writeFile(`src/modules/${name}/tests/${name}.unit.test.ts`, generateTest(name))
}

export async function runMakeNotification(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:notification <name>')
  writeFile(
    `src/modules/${name}/notifications/${name}.notification.ts`,
    generateNotification(name),
  )
}

export async function runMakeResource(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:resource <name>')
  writeFile(`src/modules/${name}/${name}.resource.ts`, generateResource(name))
}

export async function runMakePolicy(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:policy <name>')
  writeFile(`src/modules/${name}/${name}.policy.ts`, generatePolicy(name))
}

export async function runMakeJob(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:job <name>')
  writeFile(`src/jobs/${name}.job.ts`, generateJob(name))
}

export async function runMakeEmail(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:email <name>')
  writeFile(`src/emails/${name}.email.ts`, generateEmail(name))
}

export async function runMakeHelper(args: string[]): Promise<void> {
  const name = requireName(args, 'vono make:helper <name>')
  writeFile(`src/shared/utils/${name}.ts`, generateHelper(name))
}
