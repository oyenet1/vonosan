/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { ref } from 'vue'

export interface PasskeyCredentialInfo {
  id: string
  credential_id: string
  name: string | null
  device_type: string
  backed_up: boolean
  last_used_at: string | null
  created_at: string
}

/**
 * usePasskey — Vue composable for WebAuthn/Passkey authentication.
 *
 * Handles the full registration and authentication ceremony:
 * 1. Fetches challenge from the server
 * 2. Calls the browser's WebAuthn API
 * 3. Sends the response back to the server
 *
 * Usage:
 * ```ts
 * const { registerPasskey, loginWithPasskey, credentials, loading, error } = usePasskey()
 *
 * // Register a new passkey (user must be logged in)
 * await registerPasskey('My iPhone')
 *
 * // Login with a passkey (no username needed)
 * const tokens = await loginWithPasskey()
 * ```
 */
export function usePasskey() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const credentials = ref<PasskeyCredentialInfo[]>([])

  // ── Registration ──────────────────────────────────────────────────

  /**
   * Register a new passkey for the currently authenticated user.
   * Requires the user to be logged in (JWT in Authorization header).
   */
  async function registerPasskey(name?: string): Promise<{ credentialId: string } | null> {
    if (!isWebAuthnSupported()) {
      error.value = 'Passkeys are not supported in this browser'
      return null
    }

    loading.value = true
    error.value = null

    try {
      // 1. Get challenge from server
      const beginRes = await fetch('/api/v1/auth/passkey/register/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredToken()}`,
        },
      })

      if (!beginRes.ok) {
        throw new Error('Failed to begin passkey registration')
      }

      const { data: options } = await beginRes.json() as { data: PublicKeyCredentialCreationOptions }

      // 2. Call browser WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: deserializeCreationOptions(options),
      }) as PublicKeyCredential | null

      if (!credential) {
        throw new Error('Passkey creation was cancelled')
      }

      // 3. Send response to server
      const finishRes = await fetch('/api/v1/auth/passkey/register/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify({
          response: serializeCredential(credential),
          name,
        }),
      })

      if (!finishRes.ok) {
        const body = await finishRes.json() as { message: string }
        throw new Error(body.message || 'Failed to finish passkey registration')
      }

      const { data } = await finishRes.json() as { data: { credentialId: string } }

      // Refresh credentials list
      await fetchCredentials()

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Passkey registration failed'
      return null
    } finally {
      loading.value = false
    }
  }

  // ── Authentication ────────────────────────────────────────────────

  /**
   * Authenticate with a passkey.
   * Supports both usernameless (discoverable credential) and
   * username-first flows.
   */
  async function loginWithPasskey(accountId?: string): Promise<{
    accessToken: string
    refreshToken: string
  } | null> {
    if (!isWebAuthnSupported()) {
      error.value = 'Passkeys are not supported in this browser'
      return null
    }

    loading.value = true
    error.value = null

    try {
      // 1. Get challenge from server
      const beginRes = await fetch('/api/v1/auth/passkey/auth/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })

      if (!beginRes.ok) {
        throw new Error('Failed to begin passkey authentication')
      }

      const { data: options } = await beginRes.json() as { data: PublicKeyCredentialRequestOptions }

      // 2. Call browser WebAuthn API
      const assertion = await navigator.credentials.get({
        publicKey: deserializeRequestOptions(options),
      }) as PublicKeyCredential | null

      if (!assertion) {
        throw new Error('Passkey authentication was cancelled')
      }

      // 3. Send response to server
      const finishRes = await fetch('/api/v1/auth/passkey/auth/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: serializeAssertion(assertion) }),
      })

      if (!finishRes.ok) {
        const body = await finishRes.json() as { message: string }
        throw new Error(body.message || 'Passkey authentication failed')
      }

      const { data } = await finishRes.json() as {
        data: { accessToken: string; refreshToken: string }
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Passkey authentication failed'
      return null
    } finally {
      loading.value = false
    }
  }

  // ── Credential management ─────────────────────────────────────────

  async function fetchCredentials(): Promise<void> {
    try {
      const res = await fetch('/api/v1/auth/passkey/credentials', {
        headers: { Authorization: `Bearer ${getStoredToken()}` },
      })
      if (res.ok) {
        const { data } = await res.json() as { data: PasskeyCredentialInfo[] }
        credentials.value = data
      }
    } catch {
      // silently fail
    }
  }

  async function renameCredential(credentialId: string, name: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/auth/passkey/credentials/${credentialId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify({ name }),
      })
      if (res.ok) await fetchCredentials()
      return res.ok
    } catch {
      return false
    }
  }

  async function deleteCredential(credentialId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/auth/passkey/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getStoredToken()}` },
      })
      if (res.ok) await fetchCredentials()
      return res.ok
    } catch {
      return false
    }
  }

  return {
    loading,
    error,
    credentials,
    registerPasskey,
    loginWithPasskey,
    fetchCredentials,
    renameCredential,
    deleteCredential,
    isSupported: isWebAuthnSupported,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  )
}

function getStoredToken(): string {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem('access_token') ?? ''
}

/** Convert base64url strings from server to ArrayBuffers for the browser API */
function deserializeCreationOptions(
  options: PublicKeyCredentialCreationOptions,
): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: base64urlToBuffer(options.challenge as unknown as string),
    user: {
      ...options.user,
      id: base64urlToBuffer(options.user.id as unknown as string),
    },
    excludeCredentials: (options.excludeCredentials ?? []).map((c) => ({
      ...c,
      id: base64urlToBuffer(c.id as unknown as string),
    })),
  }
}

function deserializeRequestOptions(
  options: PublicKeyCredentialRequestOptions,
): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64urlToBuffer(options.challenge as unknown as string),
    allowCredentials: (options.allowCredentials ?? []).map((c) => ({
      ...c,
      id: base64urlToBuffer(c.id as unknown as string),
    })),
  }
}

/** Serialize a PublicKeyCredential (registration) for sending to the server */
function serializeCredential(credential: PublicKeyCredential): Record<string, unknown> {
  const response = credential.response as AuthenticatorAttestationResponse
  return {
    id: credential.id,
    rawId: bufferToBase64url(new Uint8Array(credential.rawId)),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64url(new Uint8Array(response.clientDataJSON)),
      attestationObject: bufferToBase64url(new Uint8Array(response.attestationObject)),
    },
  }
}

/** Serialize a PublicKeyCredential (authentication) for sending to the server */
function serializeAssertion(credential: PublicKeyCredential): Record<string, unknown> {
  const response = credential.response as AuthenticatorAssertionResponse
  return {
    id: credential.id,
    rawId: bufferToBase64url(new Uint8Array(credential.rawId)),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64url(new Uint8Array(response.clientDataJSON)),
      authenticatorData: bufferToBase64url(new Uint8Array(response.authenticatorData)),
      signature: bufferToBase64url(new Uint8Array(response.signature)),
      userHandle: response.userHandle
        ? bufferToBase64url(new Uint8Array(response.userHandle))
        : undefined,
    },
  }
}

function bufferToBase64url(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i++) binary += String.fromCharCode(buffer[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
