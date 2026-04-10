#!/usr/bin/env node

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
 * @vonosan/cli — Artisan-style CLI for the Vonosan framework.
 *
 * Command router: maps `vonosan <command>` to the appropriate handler.
 */

import { runLint } from './commands/lint.js'
import { runFixHeaders } from './commands/fix-headers.js'
import { runFixLogs } from './commands/fix-logs.js'
import { runAudit } from './commands/audit.js'
import { runEnvAdd } from './commands/env-add.js'
import { runBranchNew } from './commands/branch-new.js'
import { runBranchFinish } from './commands/branch-finish.js'
import { runCommit } from './commands/commit.js'
import {
  runMigrateRun,
  runMigrateRollback,
  runMigrateStatus,
  runMigrateReset,
  runMigrateFresh,
  runMigrateMake,
} from './commands/migrate.js'
import { runDbPush, runDbStudio, runDbSeed } from './commands/db.js'
import { runSchemaSync } from './commands/schema-sync.js'
import {
  runMakeModule,
  runMakeVersion,
  runMakeService,
  runMakeController,
  runMakeDto,
  runMakeRoutes,
  runMakeSchema,
  runMakeMiddleware,
  runMakePage,
  runMakeComponent,
  runMakeComposable,
  runMakeStore,
  runMakeMigration,
  runMakeSeed,
  runMakeTest,
  runMakeNotification,
  runMakeResource,
  runMakePolicy,
  runMakeJob,
  runMakeEmail,
  runMakeHelper,
} from './commands/make.js'
import { runAdd } from './commands/add.js'
import { runJobsRun } from './commands/jobs.js'
import { runUpgradeCheck, runUpgradeApply } from './commands/upgrade.js'
import { runTest, runTestClean } from './commands/test.js'

// ─── Command registry ─────────────────────────────────────────────────────────

type CommandHandler = (args: string[]) => Promise<void>

const COMMANDS: Record<string, CommandHandler> = {
  // Linting & auditing
  lint: runLint,
  'fix:headers': runFixHeaders,
  'fix:logs': runFixLogs,
  audit: runAudit,

  // Environment
  'env:add': runEnvAdd,

  // Git automation
  'branch:new': runBranchNew,
  'branch:finish': runBranchFinish,
  commit: runCommit,

  // Migrations
  'migrate:run': runMigrateRun,
  'migrate:rollback': runMigrateRollback,
  'migrate:status': runMigrateStatus,
  'migrate:reset': runMigrateReset,
  'migrate:fresh': runMigrateFresh,
  'migrate:make': runMigrateMake,

  // Database
  'db:push': runDbPush,
  'db:studio': runDbStudio,
  'db:seed': runDbSeed,

  // Schema
  'schema:sync': runSchemaSync,

  // Code generators
  'make:module': runMakeModule,
  'make:version': runMakeVersion,
  'make:service': runMakeService,
  'make:controller': runMakeController,
  'make:dto': runMakeDto,
  'make:routes': runMakeRoutes,
  'make:schema': runMakeSchema,
  'make:middleware': runMakeMiddleware,
  'make:page': runMakePage,
  'make:component': runMakeComponent,
  'make:composable': runMakeComposable,
  'make:store': runMakeStore,
  'make:migration': runMakeMigration,
  'make:seed': runMakeSeed,
  'make:test': runMakeTest,
  'make:notification': runMakeNotification,
  'make:resource': runMakeResource,
  'make:policy': runMakePolicy,
  'make:job': runMakeJob,
  'make:email': runMakeEmail,
  'make:helper': runMakeHelper,

  // Module installer
  add: runAdd,

  // Jobs
  'jobs:run': runJobsRun,

  // Upgrade
  'upgrade:check': runUpgradeCheck,
  'upgrade:apply-codemods': runUpgradeApply,

  // Test
  test: runTest,
  'test:clean': runTestClean,
}

// ─── Help text ────────────────────────────────────────────────────────────────

function printHelp(): void {
  process.stdout.write(`
\x1b[1mVono CLI\x1b[0m — Artisan-style tooling for the Vonosan framework

\x1b[33mUsage:\x1b[0m  vonosan <command> [args] [options]

\x1b[33mLinting & Auditing:\x1b[0m
  vonosan lint [src]              Scan for header, log, naming, versioning, DRY violations
  vonosan fix:headers [src]       Inject missing Bonifade headers
  vonosan fix:logs [src]          Replace console.* with Logger.*
  vonosan audit [--fix]           Full audit; exits 0 (clean) or 1 (violations)

\x1b[33mEnvironment:\x1b[0m
  vonosan env:add <KEY> [desc]    Append key to .env and .env.example

\x1b[33mGit Automation:\x1b[0m
  vonosan branch:new <name>       Create feature/<name> branch
  vonosan branch:finish           Merge feature branch into parent
  vonosan commit "<message>"      Validate Conventional Commits and commit

\x1b[33mMigrations:\x1b[0m
  vonosan migrate:run             Apply pending migrations
  vonosan migrate:rollback        Roll back last migration
  vonosan migrate:status          Show migration status
  vonosan migrate:reset           Rollback all, then re-run
  vonosan migrate:fresh [--seed]  Drop all, re-run, optionally seed
  vonosan migrate:make <name>     Sync schema barrel + generate migration

\x1b[33mDatabase:\x1b[0m
  vonosan db:push                 Push schema to DB (no migration file)
  vonosan db:studio               Open Drizzle Studio
  vonosan db:seed [name]          Run seed files

\x1b[33mSchema:\x1b[0m
  vonosan schema:sync             Regenerate src/db/schema.ts barrel

\x1b[33mCode Generators:\x1b[0m
  vonosan make:module <name>      Generate full module scaffold
  vonosan make:version <v>        Generate new API version namespace
  vonosan make:service <name>     Generate service file
  vonosan make:controller <name>  Generate controller file
  vonosan make:dto <name>         Generate DTO + Zod schema
  vonosan make:routes <name>      Generate routes file
  vonosan make:schema <name>      Generate Drizzle schema
  vonosan make:middleware <name>  Generate middleware
  vonosan make:page <m/Page>      Generate .page.vue
  vonosan make:component <m/C>    Generate Vue component
  vonosan make:composable <m/use> Generate composable
  vonosan make:store <name>       Generate Pinia store
  vonosan make:migration <name>   Generate SQL migration file
  vonosan make:seed <name>        Generate seed file
  vonosan make:test <name>        Generate test file
  vonosan make:notification <n>   Generate notification
  vonosan make:resource <name>    Generate resource transformer
  vonosan make:policy <name>      Generate policy class
  vonosan make:job <name>         Generate cron job
  vonosan make:email <name>       Generate email template
  vonosan make:helper <name>      Generate shared helper

\x1b[33mModule Installer:\x1b[0m
  vonosan add <module>            Install @vonosan/<module> and update config
  vonosan add <module> --eject    Copy module source into src/modules/<module>/

\x1b[33mJobs:\x1b[0m
  vonosan jobs:run <name>         Execute a named cron job immediately
`)
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp()
    return
  }

  const handler = COMMANDS[command]

  if (!handler) {
    process.stderr.write(`\x1b[31mUnknown command: "${command}"\x1b[0m\n`)
    process.stderr.write(`Run \x1b[1mvonosan --help\x1b[0m to see available commands.\n`)
    process.exit(1)
  }

  await handler(args)
}

main().catch((err) => {
  process.stderr.write(`\x1b[31mFatal error: ${String(err)}\x1b[0m\n`)
  process.exit(1)
})
