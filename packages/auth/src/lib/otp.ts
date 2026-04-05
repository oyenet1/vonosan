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
 * OTP utilities — 6-digit one-time passwords hashed with SHA-256.
 * Uses the Web Crypto API for CF Workers / Bun / Node compatibility.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * `generateOtp()` — returns a cryptographically random 6-digit string.
 */
export function generateOtp(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  const num = new DataView(bytes.buffer).getUint32(0, false)
  return String(num % 1_000_000).padStart(6, '0')
}

/**
 * `hashOtp(otp)` — SHA-256 hash of the OTP string.
 * Store this in the database, never the raw OTP.
 */
export async function hashOtp(otp: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(otp),
  )
  return toHex(buffer)
}

/**
 * `verifyOtp(otp, hash)` — timing-safe comparison of OTP against stored hash.
 */
export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  const candidate = await hashOtp(otp)
  if (candidate.length !== hash.length) return false
  let diff = 0
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i)
  }
  return diff === 0
}
