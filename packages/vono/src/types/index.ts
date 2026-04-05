/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Roles ──────────────────────────────────────────────────────────

export const ROLES = ['user', 'admin', 'superadmin', 'staff', 'customer_care'] as const
export type Role = (typeof ROLES)[number]

// ─── Auth ───────────────────────────────────────────────────────────

/** Authenticated user shape — available on c.var.account after authMiddleware */
export interface AuthAccount {
  id: string
  email: string
  username: string
  currentRole: Role
  roles: Role[]
  status: string
  language: string
}

// ─── Environment bindings (c.env) ───────────────────────────────────

/** Cloudflare Worker bindings + Node/Bun process.env keys */
export interface Env {
  // Cloudflare Hyperdrive (CF Workers only)
  HYPERDRIVE?: { connectionString: string }

  // Core
  DATABASE_URL: string
  JWT_SECRET: string
  CLIENT_URL?: string
  NODE_ENV?: string
  PORT?: string
  ALLOWED_ORIGINS?: string

  // OAuth
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string

  // Email
  RESEND_API_KEY?: string
  POSTMARK_API_KEY?: string
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASS?: string

  // Payment
  PAYSTACK_PUBLIC_KEY?: string
  PAYSTACK_SECRET_KEY?: string
  PAYSTACK_WEBHOOK_SECRET?: string
  STRIPE_PUBLISHABLE_KEY?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  PAYMENT_CREDS_ENCRYPTION_KEY?: string

  // Cloudflare
  CLOUDFLARE_API_TOKEN?: string
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_ZONE_NAME?: string

  // Storage
  R2_BUCKET_NAME?: string
  S3_BUCKET?: string
  S3_REGION?: string
  S3_ACCESS_KEY?: string
  S3_SECRET_KEY?: string
  CLOUDINARY_URL?: string
  BUNNY_STORAGE_ZONE?: string
  BUNNY_ACCESS_KEY?: string

  // Cache / Queue
  REDIS_URL?: string
  UPSTASH_REDIS_REST_URL?: string
  UPSTASH_REDIS_REST_TOKEN?: string
  QSTASH_TOKEN?: string

  // Allow additional keys
  [key: string]: unknown
}

// ─── Validated config (c.var.config) ────────────────────────────────

/** Validated, guaranteed-present config — set by configProvider middleware */
export interface Config {
  DATABASE_URL: string
  JWT_SECRET: string
  CLIENT_URL: string
  NODE_ENV: string
  ALLOWED_ORIGINS: string

  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string

  RESEND_API_KEY: string

  PAYSTACK_PUBLIC_KEY: string
  PAYSTACK_SECRET_KEY: string
  PAYSTACK_WEBHOOK_SECRET: string
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  PAYMENT_CREDS_ENCRYPTION_KEY: string

  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_ZONE_NAME: string

  [key: string]: string
}

// ─── Hono context variables (c.var) ─────────────────────────────────

/** Everything available on c.var throughout the app */
export interface AppVariables {
  config: Config
  db: unknown // typed as DrizzleDb in consuming packages
  account: AuthAccount
  [key: string]: unknown
}

// ─── VonoConfig ─────────────────────────────────────────────────────

export type Runtime =
  | 'cloudflare-workers'
  | 'cloudflare-pages'
  | 'bun'
  | 'node'
  | 'deno'
  | 'aws-lambda'
  | 'vercel'
  | 'netlify'
  | 'fastly'

export type ProjectMode = 'fullstack' | 'api'

export interface RateLimitTier {
  windowMs: number
  limit: number
}

export interface CorsConfig {
  origins?: string[]
  allowHeaders?: string[]
  allowMethods?: string[]
  credentials?: boolean
}

export interface PaymentConfig {
  driver: 'paystack' | 'stripe' | 'both'
  paystack?: {
    publicKey: string
    secretKey: string
    webhookSecret: string
  }
  stripe?: {
    publishableKey: string
    secretKey: string
    webhookSecret: string
  }
}

export interface AutoImportConfig {
  server?: {
    dirs?: string[]
    imports?: Array<{ from: string; imports: string[] }>
  }
  client?: {
    dirs?: string[]
    imports?: Array<{ from: string; imports: string[] }>
  }
}

export interface VonoConfig {
  app: {
    name: string
    url: string
    env: string
    key: string
    language: 'ts' | 'js'
  }
  runtime: Runtime
  mode: ProjectMode
  saas?: boolean
  /** Passkey (WebAuthn) configuration */
  passkeys?: {
    /** Enable passkey support in @vono/auth */
    enabled: boolean
    /** Relying Party ID — defaults to the hostname of app.url */
    rpId?: string
    /** Relying Party display name */
    rpName?: string
  }
  cors?: CorsConfig
  rateLimit?: {
    auth?: RateLimitTier
    otp?: RateLimitTier
    api?: RateLimitTier
  }
  payment?: PaymentConfig
  docs?: {
    swagger: boolean
    fiberplane: boolean
    scalar?: boolean
    openapi: string
  }
  test?: {
    driver: 'bun' | 'vitest' | 'jest'
  }
  ui?: {
    colors: {
      primary: string
      neutral: string
    }
  }
  modules?: unknown[]
  autoImport?: AutoImportConfig
  env?: {
    schema?: unknown
    refine?: (env: unknown) => boolean
  }
  ssr?: {
    fallbackToSpa?: boolean
  }
}
