/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string
  email: string
  username: string
  currentRole: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  sessionId: string
}

// ─── Shared state (module-level singleton) ────────────────────────────────────

const user = ref<AuthUser | null>(null)
const accessToken = ref<string | null>(null)
const sessionId = ref<string | null>(null)

// Restore from localStorage on module load (client-side only)
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('vono_auth')
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { user: AuthUser; accessToken: string; sessionId: string }
      user.value = parsed.user
      accessToken.value = parsed.accessToken
      sessionId.value = parsed.sessionId
    } catch {
      localStorage.removeItem('vono_auth')
    }
  }
}

// ─── useAuth composable ───────────────────────────────────────────────────────

/**
 * `useAuth()` — Vue composable for authentication state and actions.
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth()
 */
export function useAuth() {
  const router = useRouter()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  function _persist(tokens: AuthTokens, accountData: AuthUser) {
    user.value = accountData
    accessToken.value = tokens.accessToken
    sessionId.value = tokens.sessionId
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'vono_auth',
        JSON.stringify({ user: accountData, accessToken: tokens.accessToken, sessionId: tokens.sessionId }),
      )
    }
  }

  function _clear() {
    user.value = null
    accessToken.value = null
    sessionId.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vono_auth')
    }
  }

  async function login(email: string, password: string): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await res.json() as { success: boolean; message: string; data: AuthTokens & { user: AuthUser } }
      if (!body.success) throw new Error(body.message)
      _persist(body.data, body.data.user)
      router.push('/')
    } catch (err: unknown) {
      error.value = (err as Error).message ?? 'Login failed'
    } finally {
      isLoading.value = false
    }
  }

  async function register(email: string, password: string, username?: string): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      })
      const body = await res.json() as { success: boolean; message: string }
      if (!body.success) throw new Error(body.message)
      router.push('/login')
    } catch (err: unknown) {
      error.value = (err as Error).message ?? 'Registration failed'
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true
    try {
      if (sessionId.value) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}),
          },
          body: JSON.stringify({ sessionId: sessionId.value }),
        })
      }
    } finally {
      _clear()
      isLoading.value = false
      router.push('/login')
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    login,
    register,
    logout,
  }
}
