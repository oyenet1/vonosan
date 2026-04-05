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
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { AppVariables } from 'vono/types'
import { ApiResponse } from 'vono/server'
import { AuthService } from '../service/auth.service.js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).optional(),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

const ResetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8),
})

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

// ─── Router ───────────────────────────────────────────────────────────────────

const authRouter = new Hono<{ Variables: AppVariables }>()

authRouter.post('/register', zValidator('json', RegisterSchema), async (c) => {
  const { email, password, username } = c.req.valid('json')
  const service = new AuthService(c.var.db as PostgresJsDatabase, c.var.config.JWT_SECRET)
  const account = await service.register(email, password, username)
  return c.json(ApiResponse.success(account, 'Account created successfully'), 201)
})

authRouter.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')
  const userAgent = c.req.header('User-Agent')
  const service = new AuthService(c.var.db as PostgresJsDatabase, c.var.config.JWT_SECRET)
  const tokens = await service.login(email, password, ip, userAgent)
  return c.json(ApiResponse.success(tokens, 'Login successful'))
})

authRouter.post('/refresh', zValidator('json', RefreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json')
  const service = new AuthService(c.var.db as PostgresJsDatabase, c.var.config.JWT_SECRET)
  const tokens = await service.refresh(refreshToken)
  return c.json(ApiResponse.success(tokens, 'Token refreshed'))
})

authRouter.post('/logout', async (c) => {
  const body = await c.req.json<{ sessionId?: string }>().catch(() => ({}))
  if (body.sessionId) {
    const service = new AuthService(c.var.db as PostgresJsDatabase, c.var.config.JWT_SECRET)
    await service.logout(body.sessionId)
  }
  return c.json(ApiResponse.success(null, 'Logged out successfully'))
})

authRouter.post('/forgot-password', zValidator('json', ForgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json')
  const service = new AuthService(c.var.db as PostgresJsDatabase, c.var.config.JWT_SECRET)
  // OTP is returned — caller is responsible for sending it via email
  await service.forgotPassword(email)
  return c.json(ApiResponse.success(null, 'If that email exists, a reset code has been sent'))
})

authRouter.post('/reset-password', zValidator('json', ResetPasswordSchema), async (c) => {
  const { email, otp, password } = c.req.valid('json')
  const service = new AuthService(c.var.db as PostgresJsDatabase, c.var.config.JWT_SECRET)
  await service.resetPassword(email, otp, password)
  return c.json(ApiResponse.success(null, 'Password reset successfully'))
})

export default authRouter
