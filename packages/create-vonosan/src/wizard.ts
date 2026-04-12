/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import * as p from '@clack/prompts'

// ─── Types ───────────────────────────────────────────────────────────

export interface WizardAnswers {
  projectName: string
  language: 'ts' | 'js'
  projectType: 'fullstack' | 'api'
  packageManager: 'bun' | 'npm' | 'pnpm' | 'yarn'
  deploymentTarget:
    | 'bun'
    | 'nodejs'
    | 'bun-docker'
    | 'nodejs-docker'
    | 'cloudflare-workers'
    | 'cloudflare-pages'
    | 'vercel'
    | 'netlify'
    | 'deno'
    | 'aws-lambda'
  database:
    | 'postgres'
    | 'mysql'
    | 'sqlite'
    | 'turso'
    | 'singlestore'
    | 'mssql'
    | 'cockroachdb'
    | 'neon'
    | 'supabase'
    | 'vercel-postgres'
    | 'xata'
    | 'd1'
    | 'none'
  queue: 'bullmq' | 'cloudflare-queues' | 'none'
  queueRedisDriver: 'ioredis' | 'redis' | 'upstash-redis' | 'none'
  cache: 'upstash' | 'ioredis' | 'kv' | 'none'
  email: 'resend' | 'postmark' | 'smtp' | 'console' | 'none'
  storage: 'local' | 'r2' | 's3' | 'cloudinary' | 'bunny' | 'none'
  websocket: boolean
  websocketDriver: 'native' | 'socket.io' | 'cloudflare-websocket' | 'none'
  notifications: boolean
  logging: boolean
  auth: boolean
  passwordReset: boolean
  roles: boolean
  testing: 'bun' | 'vitest' | 'jest' | 'none'
  apiDocs: boolean
  saas: boolean
}

// ─── Wizard ──────────────────────────────────────────────────────────

/**
 * runWizard — interactive project setup wizard using @clack/prompts.
 * Returns a fully populated WizardAnswers object.
 */
export async function runWizard(
  projectName: string,
  saasFlag: boolean,
): Promise<WizardAnswers> {
  p.intro('Welcome to Vonosan — the full-stack TypeScript framework')

  let resolvedProjectName = projectName.trim()
  if (!resolvedProjectName.length) {
    const promptedProjectName = await p.text({
      message: 'Project name',
      placeholder: 'my-vonosan-app',
      validate: (value) => {
        const trimmed = value.trim()
        if (!trimmed) return 'Project name is required'
        if (!/^[a-z0-9-_]+$/i.test(trimmed)) {
          return 'Use only letters, numbers, hyphens, or underscores'
        }
        return undefined
      },
    })

    if (p.isCancel(promptedProjectName)) {
      p.cancel('Operation cancelled')
      throw new Error('Operation cancelled')
    }

    if (typeof promptedProjectName !== 'string') {
      throw new Error('Invalid project name input')
    }

    resolvedProjectName = promptedProjectName.trim()
  }

  const language = await p.select({
    message: 'Language',
    options: [
      { value: 'ts', label: 'TypeScript', hint: 'recommended' },
      { value: 'js', label: 'JavaScript' },
    ],
  })

  const projectType = await p.select({
    message: 'Project type',
    options: [
      { value: 'fullstack', label: 'Full-stack (Vue + Hono SSR)', hint: 'recommended' },
      { value: 'api', label: 'API only (Hono)' },
    ],
  })

  const packageManager = await p.select({
    message: 'Package manager',
    options: [
      { value: 'bun', label: 'bun', hint: 'recommended' },
      { value: 'npm', label: 'npm' },
      { value: 'pnpm', label: 'pnpm' },
      { value: 'yarn', label: 'yarn' },
    ],
  })

  const deploymentTarget = await p.select({
    message: 'Deployment target',
    options: [
      { value: 'bun', label: 'Bun (self-hosted)', hint: 'recommended' },
      { value: 'nodejs', label: 'Node.js (self-hosted)' },
      { value: 'bun-docker', label: 'Bun (Docker)' },
      { value: 'nodejs-docker', label: 'Node.js (Docker)' },
      { value: 'cloudflare-workers', label: 'Cloudflare Workers' },
      { value: 'cloudflare-pages', label: 'Cloudflare Pages' },
      { value: 'vercel', label: 'Vercel' },
      { value: 'netlify', label: 'Netlify' },
      { value: 'deno', label: 'Deno Deploy' },
      { value: 'aws-lambda', label: 'AWS Lambda' },
    ],
  })

  const database = await p.select({
    message: 'Database',
    options: [
      { value: 'postgres', label: 'PostgreSQL', hint: 'recommended' },
      { value: 'neon', label: 'Neon (PostgreSQL)' },
      { value: 'supabase', label: 'Supabase (PostgreSQL)' },
      { value: 'vercel-postgres', label: 'Vercel Postgres' },
      { value: 'xata', label: 'Xata Postgres' },
      { value: 'cockroachdb', label: 'CockroachDB' },
      { value: 'mysql', label: 'MySQL' },
      { value: 'singlestore', label: 'SingleStore' },
      { value: 'sqlite', label: 'SQLite' },
      { value: 'turso', label: 'Turso (libSQL)' },
      { value: 'mssql', label: 'MSSQL' },
      ...((deploymentTarget === 'cloudflare-workers' || deploymentTarget === 'cloudflare-pages')
        ? [{ value: 'd1', label: 'Cloudflare D1' }]
        : []),
      { value: 'none', label: 'None' },
    ],
  })

  const queue = await p.select({
    message: 'Queue driver',
    options: [
      { value: 'bullmq', label: 'BullMQ (Redis: ioredis/upstash/redis)', hint: 'bun/node' },
      ...((deploymentTarget === 'cloudflare-workers' || deploymentTarget === 'cloudflare-pages')
        ? [{ value: 'cloudflare-queues', label: 'Cloudflare Queues' }]
        : []),
      { value: 'none', label: 'None' },
    ],
  })

  let queueRedisDriver: WizardAnswers['queueRedisDriver'] = 'none'
  if (queue === 'bullmq') {
    const selectedQueueRedisDriver = await p.select({
      message: 'BullMQ Redis backend',
      options: [
        { value: 'ioredis', label: 'ioredis (recommended)' },
        { value: 'redis', label: 'node-redis (redis package)' },
        { value: 'upstash-redis', label: 'Upstash Redis (via Redis URL)' },
      ],
    })

    queueRedisDriver = selectedQueueRedisDriver as WizardAnswers['queueRedisDriver']
  }

  const cache = await p.select({
    message: 'Cache driver',
    options: [
      { value: 'upstash', label: 'Upstash Redis', hint: 'recommended' },
      { value: 'ioredis', label: 'ioredis (Redis)' },
      ...((deploymentTarget === 'cloudflare-workers' || deploymentTarget === 'cloudflare-pages')
        ? [{ value: 'kv', label: 'Cloudflare KV' }]
        : []),
      { value: 'none', label: 'None' },
    ],
  })

  const email = await p.select({
    message: 'Email driver',
    options: [
      { value: 'resend', label: 'Resend', hint: 'recommended' },
      { value: 'postmark', label: 'Postmark' },
      { value: 'smtp', label: 'SMTP' },
      { value: 'console', label: 'Console (dev only)' },
      { value: 'none', label: 'None' },
    ],
  })

  const storage = await p.select({
    message: 'File storage',
    options: [
      { value: 'local', label: 'Local filesystem' },
      { value: 'r2', label: 'Cloudflare R2' },
      { value: 's3', label: 'AWS S3' },
      { value: 'cloudinary', label: 'Cloudinary' },
      { value: 'bunny', label: 'Bunny CDN' },
      { value: 'none', label: 'None' },
    ],
  })

  const features = await p.multiselect({
    message: 'Features (space to toggle)',
    options: [
      { value: 'websocket', label: 'WebSocket support' },
      { value: 'notifications', label: 'In-app notifications' },
      { value: 'logging', label: 'Activity logging' },
      { value: 'auth', label: 'Authentication', hint: 'recommended' },
      { value: 'passwordReset', label: 'Password reset (OTP)' },
      { value: 'roles', label: 'Role-based access control' },
      { value: 'apiDocs', label: 'API docs (Swagger/Scalar)' },
      { value: 'saas', label: 'SaaS mode (multi-tenant)' },
    ],
    initialValues: ['apiDocs'],
    required: false,
  })

  const testing = await p.select({
    message: 'Test runner',
    options: [
      { value: 'bun', label: 'bun test', hint: 'recommended' },
      { value: 'vitest', label: 'Vitest' },
      { value: 'jest', label: 'Jest' },
      { value: 'none', label: 'None' },
    ],
  })

  p.outro('Project configuration complete!')

  const featureSet = new Set(features as string[])
  let websocketDriver: WizardAnswers['websocketDriver'] = 'none'
  if (featureSet.has('websocket')) {
    const selectedWebsocketDriver = await p.select({
      message: 'WebSocket driver',
      options: [
        { value: 'native', label: 'Native WebSocket' },
        { value: 'socket.io', label: 'Socket.IO' },
        ...((deploymentTarget === 'cloudflare-workers' || deploymentTarget === 'cloudflare-pages')
          ? [{ value: 'cloudflare-websocket', label: 'Cloudflare WebSocket' }]
          : []),
      ],
    })

    websocketDriver = selectedWebsocketDriver as WizardAnswers['websocketDriver']
  }

  return {
    projectName: resolvedProjectName,
    language: language as WizardAnswers['language'],
    projectType: projectType as WizardAnswers['projectType'],
    packageManager: packageManager as WizardAnswers['packageManager'],
    deploymentTarget: deploymentTarget as WizardAnswers['deploymentTarget'],
    database: database as WizardAnswers['database'],
    queue: queue as WizardAnswers['queue'],
    queueRedisDriver,
    cache: cache as WizardAnswers['cache'],
    email: email as WizardAnswers['email'],
    storage: storage as WizardAnswers['storage'],
    websocket: featureSet.has('websocket'),
    websocketDriver,
    notifications: featureSet.has('notifications'),
    logging: featureSet.has('logging'),
    auth: featureSet.has('auth'),
    passwordReset: featureSet.has('passwordReset'),
    roles: featureSet.has('roles'),
    testing: testing as WizardAnswers['testing'],
    apiDocs: featureSet.has('apiDocs'),
    saas: saasFlag || featureSet.has('saas'),
  }
}
