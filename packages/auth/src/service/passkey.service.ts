/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { eq, and, lt } from 'drizzle-orm'
import {
  generateChallenge,
  buildRegistrationOptions,
  buildAuthenticationOptions,
  verifyRegistration,
  verifyAuthentication,
  bufferToBase64url,
  base64urlToBuffer,
  type RegistrationResponse,
  type AuthenticationResponse,
} from '../lib/passkey.js'
import { passkeyCredentials, passkeyChallenges } from '../passkey-schema.js'
import { signAccessToken, signRefreshToken } from '../lib/jwt.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PasskeyServiceConfig {
  rpId: string
  rpName: string
  origin: string
  jwtSecret: string
}

// ─── PasskeyService ───────────────────────────────────────────────────────────

export class PasskeyService {
  constructor(
    private readonly db: {
      select: (...args: unknown[]) => unknown
      insert: (...args: unknown[]) => unknown
      update: (...args: unknown[]) => unknown
      delete: (...args: unknown[]) => unknown
      query: Record<string, unknown>
    },
    private readonly config: PasskeyServiceConfig,
  ) {}

  // ── Registration ────────────────────────────────────────────────────────────

  /**
   * Begin passkey registration — generates a challenge and returns
   * PublicKeyCredentialCreationOptions for the client.
   */
  async beginRegistration(accountId: string, userName: string, displayName: string) {
    // Clean up expired challenges
    await this.cleanExpiredChallenges()

    const { challenge, expiresAt } = generateChallenge()

    // Store challenge in DB
    await (this.db.insert as Function)(passkeyChallenges).values({
      challenge,
      type: 'registration',
      account_id: accountId,
      expires_at: new Date(expiresAt),
    })

    const userIdBytes = new TextEncoder().encode(accountId)
    const userId = bufferToBase64url(userIdBytes)

    return buildRegistrationOptions({
      rpId: this.config.rpId,
      rpName: this.config.rpName,
      userId,
      userName,
      userDisplayName: displayName,
      challenge,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    })
  }

  /**
   * Finish passkey registration — verifies the authenticator response
   * and stores the credential.
   */
  async finishRegistration(
    accountId: string,
    response: RegistrationResponse,
    credentialName?: string,
  ) {
    // Retrieve and validate challenge
    const challengeRecord = await this.getAndDeleteChallenge(
      response.response.clientDataJSON,
      'registration',
    )

    if (!challengeRecord) {
      throw new Error('Invalid or expired challenge')
    }

    if (challengeRecord.account_id !== accountId) {
      throw new Error('Challenge account mismatch')
    }

    // Verify the registration response
    const verified = await verifyRegistration(
      response,
      challengeRecord.challenge,
      this.config.origin,
      this.config.rpId,
    )

    // Store the credential
    await (this.db.insert as Function)(passkeyCredentials).values({
      account_id: accountId,
      credential_id: verified.credentialId,
      public_key: verified.publicKey,
      sign_count: verified.signCount,
      device_type: verified.deviceType,
      backed_up: verified.backedUp,
      aaguid: verified.aaguid,
      transports: verified.transports.join(','),
      name: credentialName ?? `Passkey ${new Date().toLocaleDateString()}`,
    })

    return { credentialId: verified.credentialId, deviceType: verified.deviceType }
  }

  // ── Authentication ──────────────────────────────────────────────────────────

  /**
   * Begin passkey authentication — generates a challenge.
   * If accountId is provided, only that account's credentials are allowed.
   * If null, any registered credential is allowed (usernameless flow).
   */
  async beginAuthentication(accountId?: string) {
    await this.cleanExpiredChallenges()

    const { challenge, expiresAt } = generateChallenge()

    await (this.db.insert as Function)(passkeyChallenges).values({
      challenge,
      type: 'authentication',
      account_id: accountId ?? null,
      expires_at: new Date(expiresAt),
    })

    // If accountId provided, include their credentials as allowCredentials
    let allowCredentials: Array<{ id: string; type: 'public-key'; transports?: string[] }> = []

    if (accountId) {
      const creds = await (this.db.select as Function)()
        .from(passkeyCredentials)
        .where(eq(passkeyCredentials.account_id, accountId)) as Array<{
          credential_id: string
          transports: string | null
        }>

      allowCredentials = creds.map((c) => ({
        id: c.credential_id,
        type: 'public-key' as const,
        transports: c.transports ? c.transports.split(',') as string[] : undefined,
      }))
    }

    return buildAuthenticationOptions({
      rpId: this.config.rpId,
      challenge,
      userVerification: 'preferred',
      allowCredentials,
    })
  }

  /**
   * Finish passkey authentication — verifies the authenticator response
   * and returns JWT tokens.
   */
  async finishAuthentication(response: AuthenticationResponse) {
    // Retrieve and validate challenge
    const challengeRecord = await this.getAndDeleteChallenge(
      response.response.clientDataJSON,
      'authentication',
    )

    if (!challengeRecord) {
      throw new Error('Invalid or expired challenge')
    }

    // Find the credential by ID
    const [cred] = await (this.db.select as Function)()
      .from(passkeyCredentials)
      .where(eq(passkeyCredentials.credential_id, response.id))
      .limit(1) as Array<{
        id: string
        account_id: string
        credential_id: string
        public_key: string
        sign_count: number
        device_type: string
        backed_up: boolean
      }>

    if (!cred) {
      throw new Error('Credential not found')
    }

    // Verify the authentication response
    const verified = await verifyAuthentication(
      response,
      challengeRecord.challenge,
      this.config.origin,
      this.config.rpId,
      {
        credentialId: cred.credential_id,
        publicKey: cred.public_key,
        signCount: cred.sign_count,
        deviceType: cred.device_type as 'platform' | 'cross-platform',
        backedUp: cred.backed_up,
        transports: [],
        aaguid: '',
      },
    )

    // Update sign count and last_used_at
    await (this.db.update as Function)(passkeyCredentials)
      .set({
        sign_count: verified.newSignCount,
        last_used_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(passkeyCredentials.credential_id, cred.credential_id))

    // Issue JWT tokens
    const payload = { accountId: cred.account_id, email: '' }
    const accessToken = await signAccessToken(payload, this.config.jwtSecret)
    const refreshToken = await signRefreshToken(payload, this.config.jwtSecret)

    return {
      accountId: cred.account_id,
      accessToken,
      refreshToken,
      userVerified: verified.userVerified,
    }
  }

  // ── Credential management ───────────────────────────────────────────────────

  /** List all passkeys for an account */
  async listCredentials(accountId: string) {
    return (this.db.select as Function)()
      .from(passkeyCredentials)
      .where(eq(passkeyCredentials.account_id, accountId))
  }

  /** Rename a passkey */
  async renameCredential(credentialId: string, accountId: string, name: string) {
    await (this.db.update as Function)(passkeyCredentials)
      .set({ name, updated_at: new Date() })
      .where(
        and(
          eq(passkeyCredentials.credential_id, credentialId),
          eq(passkeyCredentials.account_id, accountId),
        ),
      )
  }

  /** Delete a passkey */
  async deleteCredential(credentialId: string, accountId: string) {
    await (this.db.delete as Function)(passkeyCredentials).where(
      and(
        eq(passkeyCredentials.credential_id, credentialId),
        eq(passkeyCredentials.account_id, accountId),
      ),
    )
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async getAndDeleteChallenge(clientDataJSONBase64: string, type: string) {
    // Decode challenge from clientDataJSON
    const bytes = base64urlToBuffer(clientDataJSONBase64)
    const clientData = JSON.parse(new TextDecoder().decode(bytes)) as { challenge: string }

    const [record] = await (this.db.select as Function)()
      .from(passkeyChallenges)
      .where(
        and(
          eq(passkeyChallenges.challenge, clientData.challenge),
          eq(passkeyChallenges.type, type),
        ),
      )
      .limit(1) as Array<{
        id: string
        challenge: string
        type: string
        account_id: string | null
        expires_at: Date
      }>

    if (!record) return null
    if (record.expires_at < new Date()) return null

    // Delete challenge (single-use)
    await (this.db.delete as Function)(passkeyChallenges).where(
      eq(passkeyChallenges.id, record.id),
    )

    return record
  }

  private async cleanExpiredChallenges() {
    await (this.db.delete as Function)(passkeyChallenges).where(
      lt(passkeyChallenges.expires_at, new Date()),
    )
  }
}
