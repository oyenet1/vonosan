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
import { join, dirname } from 'node:path'
import type { WizardAnswers } from './wizard.js'
import { generateTemplates } from './templates.js'

// ─── scaffoldProject ─────────────────────────────────────────────────

/**
 * scaffoldProject — writes all generated project files to disk.
 *
 * @throws Error if targetDir already exists
 */
export function scaffoldProject(answers: WizardAnswers, targetDir: string): void {
  const absTarget = join(process.cwd(), targetDir)

  if (existsSync(absTarget)) {
    throw new Error(
      `Directory "${targetDir}" already exists. ` +
        `Choose a different project name or remove the existing directory.`,
    )
  }

  const templates = generateTemplates(answers)

  for (const [relPath, content] of Object.entries(templates)) {
    const absPath = join(absTarget, relPath)
    const dir = dirname(absPath)

    mkdirSync(dir, { recursive: true })
    writeFileSync(absPath, content, 'utf8')
  }

  // Safety fallback: ensure the default home page exists for full-stack apps.
  if (answers.projectType === 'fullstack') {
    const homePagePath = join(absTarget, 'src/modules/home/index.page.vue')
    if (!existsSync(homePagePath)) {
      mkdirSync(dirname(homePagePath), { recursive: true })
      writeFileSync(
        homePagePath,
        `<template>\n  <main>\n    <h1>${answers.projectName}</h1>\n    <p>Welcome to your Vonosan app.</p>\n  </main>\n</template>\n`,
        'utf8',
      )
    }
  }

  // Create standard empty directories
  const emptyDirs = [
    'src/modules',
    'src/shared/utils',
    'src/shared/gates',
    'src/shared/policies',
    'src/emails',
    'src/jobs',
    'src/locales',
    'src/db/migrations',
    'src/db/seeds',
    'public',
    'logs',
  ]

  for (const dir of emptyDirs) {
    mkdirSync(join(absTarget, dir), { recursive: true })
    // Add .gitkeep so empty dirs are tracked
    writeFileSync(join(absTarget, dir, '.gitkeep'), '', 'utf8')
  }
}
