/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// Schema
export { accounts, authSessions, verificationCodes, apiKeys } from './schema.js'

// JWT helpers
export { signAccessToken, signRefreshToken, verifyToken } from './lib/jwt.js'
export type { TokenPayload } from './lib/jwt.js'

// Password helpers
export { hashPassword, verifyPassword } from './lib/password.js'

// OTP helpers
export { generateOtp, hashOtp, verifyOtp } from './lib/otp.js'

// Middleware
export {
  authMiddleware,
  optionalAuthMiddleware,
  isAdmin,
  isSuperAdmin,
  apiKeyOrJwtMiddleware,
} from './middleware/auth.middleware.js'

// Service
export { AuthService } from './service/auth.service.js'
export type { AuthTokens, RegisterInput } from './service/auth.service.js'

// Routes
export { default as authRouter } from './routes/auth.routes.js'

// Composables (Vue — client-side)
export { useAuth } from './composables/useAuth.js'

// ─── Passkeys (WebAuthn) ─────────────────────────────────────────────────────

// Schema
export { passkeyCredentials, passkeyChallenges } from './passkey-schema.js'
export type { PasskeyCredential as PasskeyCredentialRow } from './passkey-schema.js'

// Passkey crypto helpers
export {
  generateChallenge,
  buildRegistrationOptions,
  buildAuthenticationOptions,
  verifyRegistration,
  verifyAuthentication,
  bufferToBase64url,
  base64urlToBuffer,
} from './lib/passkey.js'
export type {
  PasskeyChallenge,
  PasskeyCredential,
  RegistrationOptions,
  AuthenticationOptions,
  RegistrationResponse,
  AuthenticationResponse,
  VerifiedRegistration,
  VerifiedAuthentication,
} from './lib/passkey.js'

// Passkey service
export { PasskeyService } from './service/passkey.service.js'
export type { PasskeyServiceConfig } from './service/passkey.service.js'

// Passkey routes
export { default as passkeyRouter } from './routes/passkey.routes.js'

// Passkey composable (Vue — client-side)
export { usePasskey } from './composables/usePasskey.js'
export type { PasskeyCredentialInfo } from './composables/usePasskey.js'
