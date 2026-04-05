/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import {
  pgTable,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'

// ─── accounts ────────────────────────────────────────────────────────────────

/**
 * accounts — core user identity table.
 * Stores credentials, status, and role information.
 */
export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').notNull().unique(),
    password_hash: text('password_hash'),
    status: text('status').notNull().default('active'),
    language: text('language').notNull().default('en'),
    current_role: text('current_role').notNull().default('user'),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (t) => [
    index('accounts_email_idx').on(t.email),
    index('accounts_username_idx').on(t.username),
    index('accounts_status_idx').on(t.status),
  ],
)

// ─── auth_sessions ────────────────────────────────────────────────────────────

/**
 * auth_sessions — active refresh token sessions.
 * One row per active session; deleted on logout.
 */
export const authSessions = pgTable(
  'auth_sessions',
  {
    id: text('id').primaryKey(),
    account_id: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    token_hash: text('token_hash').notNull().unique(),
    ip: text('ip'),
    user_agent: text('user_agent'),
    expires_at: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('auth_sessions_account_id_idx').on(t.account_id),
    index('auth_sessions_token_hash_idx').on(t.token_hash),
  ],
)

// ─── verification_codes ───────────────────────────────────────────────────────

/**
 * verification_codes — OTP / magic-link codes.
 * Hashed before storage; deleted after use.
 */
export const verificationCodes = pgTable(
  'verification_codes',
  {
    id: text('id').primaryKey(),
    account_id: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    code_hash: text('code_hash').notNull(),
    type: text('type').notNull(), // 'password_reset' | 'email_verify' | 'magic_link'
    expires_at: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('verification_codes_account_id_idx').on(t.account_id),
    index('verification_codes_type_idx').on(t.type),
  ],
)

// ─── api_keys ─────────────────────────────────────────────────────────────────

/**
 * api_keys — long-lived API keys for programmatic access.
 * Keys are prefixed with `vono_` and hashed before storage.
 */
export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    account_id: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    key_hash: text('key_hash').notNull().unique(),
    name: text('name').notNull(),
    last_used_at: timestamp('last_used_at', { withTimezone: true, mode: 'date' }),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('api_keys_account_id_idx').on(t.account_id),
    index('api_keys_key_hash_idx').on(t.key_hash),
  ],
)
