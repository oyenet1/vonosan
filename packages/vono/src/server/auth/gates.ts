/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { HTTPException } from 'hono/http-exception'
import { createMiddleware } from 'hono/factory'
import type { AuthAccount, AppVariables } from '../../types/index.js'
import { Logger } from '../../shared/utils/logger.js'

// ─── Types ───────────────────────────────────────────────────────────────────

/** A gate handler receives the user and returns true if permitted */
export type GateHandler = (user: AuthAccount) => boolean | Promise<boolean>

/** A policy handler receives the user and the resource */
export type PolicyHandler<T = unknown> = (
  user: AuthAccount,
  resource: T,
) => boolean | Promise<boolean>

// ─── Registries ──────────────────────────────────────────────────────────────

const gateRegistry = new Map<string, GateHandler>()
const policyRegistry = new Map<string, PolicyHandler>()

/**
 * Register a gate for a named ability.
 *
 * @example
 * registerGate('publish-post', (user) => user.currentRole === 'admin')
 */
export function registerGate(ability: string, handler: GateHandler): void {
  gateRegistry.set(ability, handler)
}

/**
 * Register a policy for a resource type and ability.
 * The key is `resourceType:ability`.
 *
 * @example
 * registerPolicy('post:update', (user, post) => post.authorId === user.id)
 */
export function registerPolicy<T = unknown>(
  resourceType: string,
  handler: PolicyHandler<T>,
): void {
  policyRegistry.set(resourceType, handler as PolicyHandler)
}

// ─── Core checks ─────────────────────────────────────────────────────────────

/**
 * Check a gate — returns true/false without throwing.
 */
export async function checkGate(user: AuthAccount, ability: string): Promise<boolean> {
  const handler = gateRegistry.get(ability)
  if (!handler) {
    Logger.warn('[gates] No gate registered for ability', { ability })
    return false
  }
  return handler(user)
}

/**
 * Check a policy — returns true/false without throwing.
 */
export async function checkPolicy(
  user: AuthAccount,
  ability: string,
  resource: unknown,
): Promise<boolean> {
  const handler = policyRegistry.get(ability)
  if (!handler) {
    Logger.warn('[gates] No policy registered for ability', { ability })
    return false
  }
  return handler(user, resource)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * `can(user, ability, resource?)` — returns boolean, never throws.
 *
 * When a resource is provided, checks the policy registry.
 * Otherwise checks the gate registry.
 */
export async function can(
  user: AuthAccount,
  ability: string,
  resource?: unknown,
): Promise<boolean> {
  if (resource !== undefined) {
    return checkPolicy(user, ability, resource)
  }
  return checkGate(user, ability)
}

/**
 * `authorize(user, ability, resource?)` — throws HTTP 403 if not permitted.
 *
 * @throws HTTPException 403
 */
export async function authorize(
  user: AuthAccount,
  ability: string,
  resource?: unknown,
): Promise<void> {
  const permitted = await can(user, ability, resource)
  if (!permitted) {
    Logger.warn('[gates] Authorization denied', { userId: user.id, ability })
    throw new HTTPException(403, { message: 'Forbidden: insufficient permissions' })
  }
}

// ─── Middleware factories ─────────────────────────────────────────────────────

/**
 * `gate(ability)` — Hono middleware that calls `authorize(user, ability)`.
 *
 * Requires `authMiddleware` to have run first (sets c.var.account).
 *
 * @example
 * router.delete('/posts/:id', gate('delete-post'), deletePostController)
 */
export function gate(ability: string) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const user = c.var.account
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized: not authenticated' })
    }
    await authorize(user, ability)
    await next()
  })
}

/**
 * `policy(ability)` — Hono middleware that calls `authorize(user, ability, resource)`.
 *
 * Reads the resource from `c.var.resource`. Set it in a preceding middleware:
 * ```ts
 * router.put('/posts/:id',
 *   loadResource('post', (c) => db.query.posts.findFirst({ where: eq(posts.id, c.req.param('id')) })),
 *   policy('post:update'),
 *   updatePostController,
 * )
 * ```
 */
export function policy(ability: string) {
  return createMiddleware<{ Variables: AppVariables & { resource: unknown } }>(
    async (c, next) => {
      const user = c.var.account
      if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized: not authenticated' })
      }
      const resource = (c.var as Record<string, unknown>).resource
      await authorize(user, ability, resource)
      await next()
    },
  )
}
