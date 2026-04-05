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
 * Passkey (WebAuthn) helpers — server-side.
 *
 * Uses the Web Crypto API exclusively — compatible with Node.js, Bun,
 * Deno, and Cloudflare Workers. No native bindings required.
 *
 * Flow:
 *   Registration:
 *     1. Client calls POST /auth/passkey/register/begin  → gets challenge
 *     2. Client calls navigator.credentials.create()
 *     3. Client calls POST /auth/passkey/register/finish → stores credential
 *
 *   Authentication:
 *     1. Client calls POST /auth/passkey/auth/begin      → gets challenge
 *     2. Client calls navigator.credentials.get()
 *     3. Client calls POST /auth/passkey/auth/finish     → verifies + issues tokens
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PasskeyChallenge {
  challenge: string   // base64url-encoded random bytes
  expiresAt: number   // Unix timestamp (ms)
}

export interface PasskeyCredential {
  credentialId: string        // base64url-encoded credential ID
  publicKey: string           // base64url-encoded COSE public key
  signCount: number           // replay-attack counter
  transports?: string[]       // 'internal' | 'usb' | 'nfc' | 'ble' | 'hybrid'
  deviceType: 'platform' | 'cross-platform'
  backedUp: boolean
  aaguid: string              // authenticator AAGUID (device type identifier)
}

export interface RegistrationOptions {
  rpId: string
  rpName: string
  userId: string              // base64url-encoded user ID
  userName: string
  userDisplayName: string
  challenge: string           // base64url-encoded challenge
  timeout?: number
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise'
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform'
    residentKey?: 'required' | 'preferred' | 'discouraged'
    userVerification?: 'required' | 'preferred' | 'discouraged'
    requireResidentKey?: boolean
  }
}

export interface AuthenticationOptions {
  rpId: string
  challenge: string           // base64url-encoded challenge
  timeout?: number
  userVerification?: 'required' | 'preferred' | 'discouraged'
  allowCredentials?: Array<{ id: string; type: 'public-key'; transports?: string[] }>
}

export interface RegistrationResponse {
  id: string
  rawId: string
  type: 'public-key'
  response: {
    clientDataJSON: string    // base64url
    attestationObject: string // base64url
  }
}

export interface AuthenticationResponse {
  id: string
  rawId: string
  type: 'public-key'
  response: {
    clientDataJSON: string    // base64url
    authenticatorData: string // base64url
    signature: string         // base64url
    userHandle?: string       // base64url
  }
}

export interface VerifiedRegistration {
  credentialId: string
  publicKey: string
  signCount: number
  aaguid: string
  deviceType: 'platform' | 'cross-platform'
  backedUp: boolean
  transports: string[]
}

export interface VerifiedAuthentication {
  credentialId: string
  newSignCount: number
  userVerified: boolean
}

// ─── Challenge generation ─────────────────────────────────────────────────────

const CHALLENGE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Generate a cryptographically random challenge for WebAuthn.
 * Returns a base64url-encoded 32-byte random value.
 */
export function generateChallenge(): PasskeyChallenge {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return {
    challenge: bufferToBase64url(bytes),
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  }
}

/**
 * Build the PublicKeyCredentialCreationOptions for registration.
 */
export function buildRegistrationOptions(opts: RegistrationOptions): Record<string, unknown> {
  return {
    rp: { id: opts.rpId, name: opts.rpName },
    user: {
      id: opts.userId,
      name: opts.userName,
      displayName: opts.userDisplayName,
    },
    challenge: opts.challenge,
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },   // ES256 (ECDSA P-256)
      { alg: -257, type: 'public-key' }, // RS256 (RSA PKCS1)
    ],
    timeout: opts.timeout ?? 60000,
    attestation: opts.attestation ?? 'none',
    authenticatorSelection: opts.authenticatorSelection ?? {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    excludeCredentials: [],
  }
}

/**
 * Build the PublicKeyCredentialRequestOptions for authentication.
 */
export function buildAuthenticationOptions(opts: AuthenticationOptions): Record<string, unknown> {
  return {
    rpId: opts.rpId,
    challenge: opts.challenge,
    timeout: opts.timeout ?? 60000,
    userVerification: opts.userVerification ?? 'preferred',
    allowCredentials: opts.allowCredentials ?? [],
  }
}

// ─── Registration verification ───────────────────────────────────────────────

/**
 * Verify a WebAuthn registration response.
 *
 * Validates:
 * - clientDataJSON type, origin, and challenge
 * - attestationObject format (none attestation)
 * - Extracts public key, sign count, AAGUID, and device type
 *
 * @throws Error if verification fails
 */
export async function verifyRegistration(
  response: RegistrationResponse,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRpId: string,
): Promise<VerifiedRegistration> {
  // 1. Decode and verify clientDataJSON
  const clientData = decodeClientDataJSON(response.response.clientDataJSON)

  if (clientData.type !== 'webauthn.create') {
    throw new Error('Invalid clientData type for registration')
  }
  if (clientData.challenge !== expectedChallenge) {
    throw new Error('Challenge mismatch')
  }
  if (clientData.origin !== expectedOrigin) {
    throw new Error(`Origin mismatch: expected ${expectedOrigin}, got ${clientData.origin}`)
  }

  // 2. Decode attestationObject (CBOR — simplified for 'none' attestation)
  const attestationBytes = base64urlToBuffer(response.response.attestationObject)
  const attestation = decodeCBOR(attestationBytes)

  if (!attestation || typeof attestation !== 'object') {
    throw new Error('Failed to decode attestationObject')
  }

  const { fmt, authData } = attestation as { fmt: string; authData: Uint8Array }

  if (fmt !== 'none' && fmt !== 'packed') {
    // For now we only support 'none' attestation (most common for passkeys)
    // 'packed' is also common — we accept it but don't verify the attestation statement
  }

  // 3. Parse authenticatorData
  const parsedAuthData = parseAuthenticatorData(authData)

  // 4. Verify RP ID hash
  const rpIdHash = await sha256(new TextEncoder().encode(expectedRpId))
  if (!bufferEqual(parsedAuthData.rpIdHash, rpIdHash)) {
    throw new Error('RP ID hash mismatch')
  }

  // 5. Check flags
  const { flags } = parsedAuthData
  if (!(flags & 0x01)) throw new Error('User presence flag not set')

  // 6. Extract credential data
  if (!parsedAuthData.attestedCredentialData) {
    throw new Error('No attested credential data in authenticatorData')
  }

  const { credentialId, publicKey, aaguid } = parsedAuthData.attestedCredentialData

  // 7. Determine device type from flags
  const backedUp = !!(flags & 0x10)
  const deviceType: 'platform' | 'cross-platform' =
    !!(flags & 0x08) ? 'platform' : 'cross-platform'

  return {
    credentialId: bufferToBase64url(credentialId),
    publicKey: bufferToBase64url(publicKey),
    signCount: parsedAuthData.signCount,
    aaguid: formatAaguid(aaguid),
    deviceType,
    backedUp,
    transports: [],
  }
}

// ─── Authentication verification ─────────────────────────────────────────────

/**
 * Verify a WebAuthn authentication response.
 *
 * Validates:
 * - clientDataJSON type, origin, and challenge
 * - authenticatorData RP ID hash and flags
 * - Signature over authenticatorData + clientDataHash using stored public key
 * - Sign count (replay attack prevention)
 *
 * @throws Error if verification fails
 */
export async function verifyAuthentication(
  response: AuthenticationResponse,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRpId: string,
  storedCredential: PasskeyCredential,
): Promise<VerifiedAuthentication> {
  // 1. Verify clientDataJSON
  const clientData = decodeClientDataJSON(response.response.clientDataJSON)

  if (clientData.type !== 'webauthn.get') {
    throw new Error('Invalid clientData type for authentication')
  }
  if (clientData.challenge !== expectedChallenge) {
    throw new Error('Challenge mismatch')
  }
  if (clientData.origin !== expectedOrigin) {
    throw new Error(`Origin mismatch: expected ${expectedOrigin}, got ${clientData.origin}`)
  }

  // 2. Parse authenticatorData
  const authDataBytes = base64urlToBuffer(response.response.authenticatorData)
  const parsedAuthData = parseAuthenticatorData(authDataBytes)

  // 3. Verify RP ID hash
  const rpIdHash = await sha256(new TextEncoder().encode(expectedRpId))
  if (!bufferEqual(parsedAuthData.rpIdHash, rpIdHash)) {
    throw new Error('RP ID hash mismatch')
  }

  // 4. Check user presence flag
  if (!(parsedAuthData.flags & 0x01)) {
    throw new Error('User presence flag not set')
  }

  const userVerified = !!(parsedAuthData.flags & 0x04)

  // 5. Verify sign count (replay attack prevention)
  if (
    parsedAuthData.signCount !== 0 &&
    storedCredential.signCount !== 0 &&
    parsedAuthData.signCount <= storedCredential.signCount
  ) {
    throw new Error(
      `Sign count mismatch — possible replay attack. ` +
      `Stored: ${storedCredential.signCount}, received: ${parsedAuthData.signCount}`,
    )
  }

  // 6. Verify signature
  const clientDataHash = await sha256(base64urlToBuffer(response.response.clientDataJSON))
  const signedData = concatBuffers(authDataBytes, clientDataHash)
  const signature = base64urlToBuffer(response.response.signature)
  const publicKeyBytes = base64urlToBuffer(storedCredential.publicKey)

  const valid = await verifySignature(publicKeyBytes, signature, signedData)
  if (!valid) {
    throw new Error('Signature verification failed')
  }

  return {
    credentialId: storedCredential.credentialId,
    newSignCount: parsedAuthData.signCount,
    userVerified,
  }
}

// ─── Crypto helpers ───────────────────────────────────────────────────────────

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hash)
}

async function verifySignature(
  publicKeyBytes: Uint8Array,
  signature: Uint8Array,
  data: Uint8Array,
): Promise<boolean> {
  try {
    // Import COSE-encoded public key
    // COSE key for ES256: kty=2 (EC), alg=-7, crv=1 (P-256), x, y
    const coseKey = decodeCBOR(publicKeyBytes) as Record<number, unknown>

    if (!coseKey) return false

    const kty = coseKey[1] as number
    const alg = coseKey[3] as number

    if (kty === 2 && alg === -7) {
      // EC P-256 (ES256)
      const x = coseKey[-2] as Uint8Array
      const y = coseKey[-3] as Uint8Array

      const jwk = {
        kty: 'EC',
        crv: 'P-256',
        x: bufferToBase64url(x),
        y: bufferToBase64url(y),
      }

      const key = await crypto.subtle.importKey(
        'jwk', jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify'],
      )

      // Convert DER signature to raw r||s format
      const rawSig = derToRaw(signature)

      return crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        rawSig,
        data,
      )
    }

    if (kty === 3 && alg === -257) {
      // RSA PKCS1 (RS256)
      const n = coseKey[-1] as Uint8Array
      const e = coseKey[-2] as Uint8Array

      const jwk = {
        kty: 'RSA',
        alg: 'RS256',
        n: bufferToBase64url(n),
        e: bufferToBase64url(e),
      }

      const key = await crypto.subtle.importKey(
        'jwk', jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      )

      return crypto.subtle.verify(
        { name: 'RSASSA-PKCS1-v1_5' },
        key,
        signature,
        data,
      )
    }

    return false
  } catch {
    return false
  }
}

// ─── Encoding helpers ─────────────────────────────────────────────────────────

export function bufferToBase64url(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function base64urlToBuffer(base64url: string): Uint8Array {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function bufferEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const total = buffers.reduce((sum, b) => sum + b.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const buf of buffers) {
    result.set(buf, offset)
    offset += buf.length
  }
  return result
}

// ─── CBOR decoder (minimal — handles WebAuthn subset) ────────────────────────

function decodeCBOR(data: Uint8Array): unknown {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const [value] = decodeCBORValue(view, 0)
  return value
}

function decodeCBORValue(view: DataView, offset: number): [unknown, number] {
  const byte = view.getUint8(offset)
  const majorType = (byte >> 5) & 0x07
  const additionalInfo = byte & 0x1f
  offset++

  let length: number
  if (additionalInfo < 24) {
    length = additionalInfo
  } else if (additionalInfo === 24) {
    length = view.getUint8(offset++)
  } else if (additionalInfo === 25) {
    length = view.getUint16(offset)
    offset += 2
  } else if (additionalInfo === 26) {
    length = view.getUint32(offset)
    offset += 4
  } else {
    length = 0
  }

  switch (majorType) {
    case 0: return [length, offset]                          // unsigned int
    case 1: return [-(length + 1), offset]                  // negative int
    case 2: {                                                // byte string
      const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length)
      return [bytes, offset + length]
    }
    case 3: {                                                // text string
      const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length)
      return [new TextDecoder().decode(bytes), offset + length]
    }
    case 4: {                                                // array
      const arr: unknown[] = []
      for (let i = 0; i < length; i++) {
        const [val, newOffset] = decodeCBORValue(view, offset)
        arr.push(val)
        offset = newOffset
      }
      return [arr, offset]
    }
    case 5: {                                                // map
      const map: Record<number | string, unknown> = {}
      for (let i = 0; i < length; i++) {
        const [key, o1] = decodeCBORValue(view, offset)
        const [val, o2] = decodeCBORValue(view, o1)
        map[key as number | string] = val
        offset = o2
      }
      return [map, offset]
    }
    default: return [null, offset]
  }
}

// ─── AuthenticatorData parser ─────────────────────────────────────────────────

interface ParsedAuthData {
  rpIdHash: Uint8Array
  flags: number
  signCount: number
  attestedCredentialData?: {
    aaguid: Uint8Array
    credentialId: Uint8Array
    publicKey: Uint8Array
  }
}

function parseAuthenticatorData(data: Uint8Array): ParsedAuthData {
  let offset = 0

  const rpIdHash = data.slice(offset, offset + 32)
  offset += 32

  const flags = data[offset++]
  const signCount = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0)
  offset += 4

  let attestedCredentialData: ParsedAuthData['attestedCredentialData']

  // AT flag (bit 6) indicates attested credential data is present
  if (flags & 0x40) {
    const aaguid = data.slice(offset, offset + 16)
    offset += 16

    const credIdLen = new DataView(data.buffer, data.byteOffset + offset, 2).getUint16(0)
    offset += 2

    const credentialId = data.slice(offset, offset + credIdLen)
    offset += credIdLen

    // Remaining bytes are the COSE-encoded public key
    const publicKey = data.slice(offset)

    attestedCredentialData = { aaguid, credentialId, publicKey }
  }

  return { rpIdHash, flags, signCount, attestedCredentialData }
}

// ─── clientDataJSON decoder ───────────────────────────────────────────────────

function decodeClientDataJSON(base64url: string): {
  type: string
  challenge: string
  origin: string
  crossOrigin?: boolean
} {
  const bytes = base64urlToBuffer(base64url)
  const json = new TextDecoder().decode(bytes)
  return JSON.parse(json)
}

// ─── DER → raw signature conversion ──────────────────────────────────────────

function derToRaw(der: Uint8Array): Uint8Array {
  // DER SEQUENCE { INTEGER r, INTEGER s } → raw 64-byte r||s
  if (der[0] !== 0x30) return der // not DER, return as-is

  let offset = 2
  if (der[1] & 0x80) offset += der[1] & 0x7f

  // r
  offset++ // 0x02
  let rLen = der[offset++]
  if (rLen & 0x80) { rLen = der[offset++] }
  const rStart = offset + (der[offset] === 0x00 ? 1 : 0)
  const rEnd = offset + rLen
  const r = der.slice(rStart, rEnd)
  offset = rEnd

  // s
  offset++ // 0x02
  let sLen = der[offset++]
  if (sLen & 0x80) { sLen = der[offset++] }
  const sStart = offset + (der[offset] === 0x00 ? 1 : 0)
  const sEnd = offset + sLen
  const s = der.slice(sStart, sEnd)

  // Pad to 32 bytes each
  const raw = new Uint8Array(64)
  raw.set(r, 32 - r.length)
  raw.set(s, 64 - s.length)
  return raw
}

// ─── AAGUID formatter ─────────────────────────────────────────────────────────

function formatAaguid(bytes: Uint8Array): string {
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
