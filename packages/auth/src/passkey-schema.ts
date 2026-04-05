/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'

/**
 * passkey_credentials — stores WebAuthn/Passkey credentials per account.
 *
 * One account can have multiple passkeys (e.g. phone + laptop + YubiKey).
 * Each credential is identified by its credentialId (from the authenticator).
 */
export const passkeyCredentials = pgTable(
  'passkey_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** FK → accounts.id */
    account_id: uuid('account_id').notNull(),

    /** base64url-encoded credential ID from the authenticator */
    credential_id: varchar('credential_id', { length: 512 }).notNull().unique(),

    /** base64url-encoded COSE public key */
    public_key: text('public_key').notNull(),

    /** Replay-attack counter — must increase on every authentication */
    sign_count: integer('sign_count').notNull().default(0),

    /** 'platform' (device biometrics) or 'cross-platform' (security key) */
    device_type: varchar('device_type', { length: 20 }).notNull().default('platform'),

    /** Whether the credential is backed up to the cloud (e.g. iCloud Keychain) */
    backed_up: boolean('backed_up').notNull().default(false),

    /** Authenticator AAGUID — identifies the authenticator model */
    aaguid: varchar('aaguid', { length: 36 }).notNull().default('00000000-0000-0000-0000-000000000000'),

    /** Comma-separated transport hints: internal, usb, nfc, ble, hybrid */
    transports: varchar('transports', { length: 255 }),

    /** Human-readable name set by the user (e.g. "iPhone 15", "YubiKey 5") */
    name: varchar('name', { length: 100 }),

    last_used_at: timestamp('last_used_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    accountIdx: index('passkey_credentials_account_id_idx').on(table.account_id),
    credentialIdx: index('passkey_credentials_credential_id_idx').on(table.credential_id),
  }),
)

/**
 * passkey_challenges — temporary challenge storage for WebAuthn ceremonies.
 *
 * Challenges expire after 5 minutes and are deleted after use.
 */
export const passkeyChallenges = pgTable(
  'passkey_challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** base64url-encoded random challenge */
    challenge: varchar('challenge', { length: 512 }).notNull().unique(),

    /** 'registration' or 'authentication' */
    type: varchar('type', { length: 20 }).notNull(),

    /** FK → accounts.id (null for registration before account exists) */
    account_id: uuid('account_id'),

    expires_at: timestamp('expires_at').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    challengeIdx: index('passkey_challenges_challenge_idx').on(table.challenge),
    expiresIdx: index('passkey_challenges_expires_at_idx').on(table.expires_at),
  }),
)

export type PasskeyCredential = typeof passkeyCredentials.$inferSelect
export type NewPasskeyCredential = typeof passkeyCredentials.$inferInsert
export type PasskeyChallenge = typeof passkeyChallenges.$inferSelect
