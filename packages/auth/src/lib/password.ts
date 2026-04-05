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
 * Password hashing via PBKDF2 using the Web Crypto API.
 *
 * Compatible with Cloudflare Workers, Bun, Node.js (18+), and Deno.
 * No native addons required.
 *
 * Format: `<hex-salt>:<hex-hash>`
 */

const ITERATIONS = 100_000
const KEY_LENGTH = 32 // bytes → 256-bit
const DIGEST = 'SHA-256'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * `hashPassword(password)` — derives a PBKDF2 hash from a plaintext password.
 * Returns a `salt:hash` string safe to store in the database.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = toHex(saltBytes.buffer)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: ITERATIONS,
      hash: DIGEST,
    },
    keyMaterial,
    KEY_LENGTH * 8,
  )

  return `${salt}:${toHex(hashBuffer)}`
}

/**
 * `verifyPassword(password, storedHash)` — timing-safe comparison.
 * Returns true if the password matches the stored `salt:hash`.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':')
  if (!saltHex || !hashHex) return false

  const saltBytes = fromHex(saltHex)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: ITERATIONS,
      hash: DIGEST,
    },
    keyMaterial,
    KEY_LENGTH * 8,
  )

  const candidateHex = toHex(hashBuffer)

  // Timing-safe comparison — compare byte-by-byte without short-circuiting
  if (candidateHex.length !== hashHex.length) return false
  let diff = 0
  for (let i = 0; i < candidateHex.length; i++) {
    diff |= candidateHex.charCodeAt(i) ^ hashHex.charCodeAt(i)
  }
  return diff === 0
}
