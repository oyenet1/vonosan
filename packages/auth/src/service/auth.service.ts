/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { eq, and, gt } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { HTTPException } from 'hono/http-exception'
import { generateId } from 'vonosan/server'
import { Logger } from 'vonosan/server'
import { accounts, authSessions, verificationCodes } from '../schema.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt.js'
import { generateOtp, hashOtp, verifyOtp } from '../lib/otp.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  sessionId: string
}

export interface RegisterInput {
  email: string
  password: string
  username?: string
}

// ─── AuthService ─────────────────────────────────────────────────────────────

/**
 * AuthService — handles all authentication flows.
 *
 * Inject via constructor with a Drizzle db instance and JWT secret.
 */
export class AuthService {
  constructor(
    private readonly db: PostgresJsDatabase,
    private readonly jwtSecret: string,
  ) {}

  // ─── register ──────────────────────────────────────────────────────────────

  /**
   * Register a new account with email + password.
   * Assigns the 'user' role by default.
   */
  async register(
    email: string,
    password: string,
    username?: string,
  ): Promise<{ id: string; email: string }> {
    const existing = await this.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.email, email.toLowerCase()))
      .limit(1)

    if (existing.length > 0) {
      throw new HTTPException(409, { message: 'An account with this email already exists' })
    }

    const id = generateId()
    const passwordHash = await hashPassword(password)
    const resolvedUsername = username ?? email.split('@')[0]

    await this.db.insert(accounts).values({
      id,
      email: email.toLowerCase(),
      username: resolvedUsername,
      password_hash: passwordHash,
      status: 'active',
      current_role: 'user',
      language: 'en',
    })

    Logger.info('[auth] Account registered', { id, email })
    return { id, email: email.toLowerCase() }
  }

  // ─── login ─────────────────────────────────────────────────────────────────

  /**
   * Authenticate with email + password.
   * Creates a session and returns access + refresh tokens.
   */
  async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const [account] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.email, email.toLowerCase()))
      .limit(1)

    if (!account || !account.password_hash) {
      throw new HTTPException(401, { message: 'Invalid email or password' })
    }

    if (account.status !== 'active') {
      throw new HTTPException(403, { message: 'Account is suspended' })
    }

    const valid = await verifyPassword(password, account.password_hash)
    if (!valid) {
      throw new HTTPException(401, { message: 'Invalid email or password' })
    }

    return this._createSession(account, ip, userAgent)
  }

  // ─── refresh ───────────────────────────────────────────────────────────────

  /**
   * Exchange a refresh token for a new access + refresh token pair.
   * Rotates the refresh token (old session deleted, new one created).
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await verifyToken(refreshToken, this.jwtSecret)
    if (!payload) {
      throw new HTTPException(401, { message: 'Invalid or expired refresh token' })
    }

    // Verify session exists
    const tokenHash = await hashOtp(refreshToken)
    const [session] = await this.db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.account_id, payload.sub),
          eq(authSessions.token_hash, tokenHash),
          gt(authSessions.expires_at, new Date()),
        ),
      )
      .limit(1)

    if (!session) {
      throw new HTTPException(401, { message: 'Session not found or expired' })
    }

    // Delete old session
    await this.db.delete(authSessions).where(eq(authSessions.id, session.id))

    const [account] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, payload.sub))
      .limit(1)

    if (!account || account.status !== 'active') {
      throw new HTTPException(401, { message: 'Account not found or inactive' })
    }

    return this._createSession(account)
  }

  // ─── logout ────────────────────────────────────────────────────────────────

  /**
   * Invalidate a session by ID.
   */
  async logout(sessionId: string): Promise<void> {
    await this.db.delete(authSessions).where(eq(authSessions.id, sessionId))
    Logger.info('[auth] Session deleted', { sessionId })
  }

  // ─── forgotPassword ────────────────────────────────────────────────────────

  /**
   * Generate a 6-digit OTP for password reset.
   * Stores the hash; returns the raw OTP so the caller can send it via email.
   */
  async forgotPassword(email: string): Promise<string> {
    const [account] = await this.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.email, email.toLowerCase()))
      .limit(1)

    if (!account) {
      // Don't reveal whether the email exists
      return generateOtp()
    }

    const otp = generateOtp()
    const codeHash = await hashOtp(otp)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Remove any existing codes for this account
    await this.db
      .delete(verificationCodes)
      .where(
        and(
          eq(verificationCodes.account_id, account.id),
          eq(verificationCodes.type, 'password_reset'),
        ),
      )

    await this.db.insert(verificationCodes).values({
      id: generateId(),
      account_id: account.id,
      code_hash: codeHash,
      type: 'password_reset',
      expires_at: expiresAt,
    })

    Logger.info('[auth] Password reset OTP generated', { accountId: account.id })
    return otp
  }

  // ─── resetPassword ─────────────────────────────────────────────────────────

  /**
   * Verify OTP and update the account password.
   * Invalidates all existing sessions after reset.
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    const [account] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.email, email.toLowerCase()))
      .limit(1)

    if (!account) {
      throw new HTTPException(400, { message: 'Invalid reset request' })
    }

    const [code] = await this.db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.account_id, account.id),
          eq(verificationCodes.type, 'password_reset'),
          gt(verificationCodes.expires_at, new Date()),
        ),
      )
      .limit(1)

    if (!code) {
      throw new HTTPException(400, { message: 'OTP expired or not found' })
    }

    const valid = await verifyOtp(otp, code.code_hash)
    if (!valid) {
      throw new HTTPException(400, { message: 'Invalid OTP' })
    }

    const newHash = await hashPassword(newPassword)

    await this.db
      .update(accounts)
      .set({ password_hash: newHash, updated_at: new Date() })
      .where(eq(accounts.id, account.id))

    // Delete the used code
    await this.db.delete(verificationCodes).where(eq(verificationCodes.id, code.id))

    // Invalidate all sessions
    await this.db.delete(authSessions).where(eq(authSessions.account_id, account.id))

    Logger.info('[auth] Password reset complete', { accountId: account.id })
  }

  // ─── findOrCreateOAuthAccount ──────────────────────────────────────────────

  /**
   * Find or create an account for OAuth providers (Google, GitHub, etc.).
   * Returns the account and whether it was newly created.
   */
  async findOrCreateOAuthAccount(
    _provider: string,
    _providerId: string,
    email: string,
    name: string,
  ): Promise<{ account: typeof accounts.$inferSelect; isNew: boolean }> {
    const [existing] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.email, email.toLowerCase()))
      .limit(1)

    if (existing) {
      return { account: existing, isNew: false }
    }

    const id = generateId()
    const username = name.toLowerCase().replace(/\s+/g, '_') + '_' + id.slice(0, 6)

    const [created] = await this.db
      .insert(accounts)
      .values({
        id,
        email: email.toLowerCase(),
        username,
        password_hash: null,
        status: 'active',
        current_role: 'user',
        language: 'en',
      })
      .returning()

    Logger.info('[auth] OAuth account created', { id, email, provider: _provider })
    return { account: created, isNew: true }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async _createSession(
    account: typeof accounts.$inferSelect,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const payload = {
      sub: account.id,
      email: account.email,
      role: account.current_role,
    }

    const accessToken = await signAccessToken(payload, this.jwtSecret)
    const refreshToken = await signRefreshToken(payload, this.jwtSecret)

    const sessionId = generateId()
    const tokenHash = await hashOtp(refreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await this.db.insert(authSessions).values({
      id: sessionId,
      account_id: account.id,
      token_hash: tokenHash,
      ip: ip ?? null,
      user_agent: userAgent ?? null,
      expires_at: expiresAt,
    })

    return { accessToken, refreshToken, sessionId }
  }
}
