/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppVariables } from 'vono/types'
import { success, error } from 'vono/server'
import { PasskeyService } from '../service/passkey.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const passkeyRoutes = new Hono<{ Variables: AppVariables }>()

// ─── Helper to build PasskeyService from context ─────────────────────────────

function getService(c: Parameters<typeof passkeyRoutes.get>[1] extends (c: infer C) => unknown ? C : never) {
  const db = c.var.db as Parameters<typeof PasskeyService>[0]
  const config = c.var.config

  const origin = config.CLIENT_URL || 'http://localhost:5173'
  const rpId = new URL(origin).hostname

  return new PasskeyService(db, {
    rpId,
    rpName: 'Vono App',
    origin,
    jwtSecret: config.JWT_SECRET,
  })
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * POST /auth/passkey/register/begin
 * Requires: authenticated user (JWT)
 * Returns: PublicKeyCredentialCreationOptions
 */
passkeyRoutes.post('/register/begin', authMiddleware, async (c) => {
  const account = c.var.account
  const service = getService(c as unknown as Parameters<typeof getService>[0])

  const options = await service.beginRegistration(
    account.id,
    account.username || account.email,
    account.email,
  )

  return c.json(success('Registration challenge created', options))
})

/**
 * POST /auth/passkey/register/finish
 * Requires: authenticated user (JWT)
 * Body: { response: RegistrationResponse, name?: string }
 */
passkeyRoutes.post('/register/finish', authMiddleware, async (c) => {
  const account = c.var.account
  const body = await c.req.json() as { response: unknown; name?: string }

  if (!body.response) {
    return c.json(error('Missing registration response'), 422)
  }

  const service = getService(c as unknown as Parameters<typeof getService>[0])

  const result = await service.finishRegistration(
    account.id,
    body.response as Parameters<typeof service.finishRegistration>[1],
    body.name,
  )

  return c.json(success('Passkey registered successfully', result), 201)
})

// ─── Authentication ───────────────────────────────────────────────────────────

/**
 * POST /auth/passkey/auth/begin
 * Public endpoint — no JWT required
 * Body: { accountId?: string }  (omit for usernameless flow)
 * Returns: PublicKeyCredentialRequestOptions
 */
passkeyRoutes.post('/auth/begin', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { accountId?: string }
  const service = getService(c as unknown as Parameters<typeof getService>[0])

  const options = await service.beginAuthentication(body.accountId)

  return c.json(success('Authentication challenge created', options))
})

/**
 * POST /auth/passkey/auth/finish
 * Public endpoint — no JWT required
 * Body: { response: AuthenticationResponse }
 * Returns: { accessToken, refreshToken }
 */
passkeyRoutes.post('/auth/finish', async (c) => {
  const body = await c.req.json() as { response: unknown }

  if (!body.response) {
    return c.json(error('Missing authentication response'), 422)
  }

  const service = getService(c as unknown as Parameters<typeof getService>[0])

  const result = await service.finishAuthentication(
    body.response as Parameters<typeof service.finishAuthentication>[0],
  )

  return c.json(success('Authentication successful', {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    accountId: result.accountId,
  }))
})

// ─── Credential management ────────────────────────────────────────────────────

/**
 * GET /auth/passkey/credentials
 * Requires: authenticated user
 * Returns: list of passkeys for the current user
 */
passkeyRoutes.get('/credentials', authMiddleware, async (c) => {
  const account = c.var.account
  const service = getService(c as unknown as Parameters<typeof getService>[0])

  const credentials = await service.listCredentials(account.id)

  return c.json(success('Passkeys retrieved', credentials))
})

/**
 * PATCH /auth/passkey/credentials/:credentialId
 * Requires: authenticated user
 * Body: { name: string }
 */
passkeyRoutes.patch('/credentials/:credentialId', authMiddleware, async (c) => {
  const account = c.var.account
  const { credentialId } = c.req.param()
  const body = await c.req.json() as { name?: string }

  if (!body.name) {
    return c.json(error('Name is required'), 422)
  }

  const service = getService(c as unknown as Parameters<typeof getService>[0])
  await service.renameCredential(credentialId, account.id, body.name)

  return c.json(success('Passkey renamed'))
})

/**
 * DELETE /auth/passkey/credentials/:credentialId
 * Requires: authenticated user
 */
passkeyRoutes.delete('/credentials/:credentialId', authMiddleware, async (c) => {
  const account = c.var.account
  const { credentialId } = c.req.param()
  const service = getService(c as unknown as Parameters<typeof getService>[0])

  await service.deleteCredential(credentialId, account.id)

  return c.json(success('Passkey deleted'))
})

export default passkeyRoutes
