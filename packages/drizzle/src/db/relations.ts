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
 * src/db/relations.ts — cross-module Drizzle relations scaffold.
 *
 * Drizzle requires all relations to be defined in a single place so
 * the query builder can resolve joins across modules. This file is the
 * central registry for all cross-module relations.
 *
 * How to use:
 *   1. Import your table schemas from each module.
 *   2. Define relations using Drizzle's `relations()` helper.
 *   3. Export all relation objects so they are included in the schema barrel.
 *
 * Example:
 * ```ts
 * import { relations } from 'drizzle-orm'
 * import { users } from '../modules/auth/auth.schema.js'
 * import { posts } from '../modules/blog/blog.schema.js'
 *
 * export const usersRelations = relations(users, ({ many }) => ({
 *   posts: many(posts),
 * }))
 *
 * export const postsRelations = relations(posts, ({ one }) => ({
 *   author: one(users, {
 *     fields: [posts.user_id],
 *     references: [users.id],
 *   }),
 * }))
 * ```
 *
 * Then include in your schema barrel (src/db/schema.ts):
 * ```ts
 * export * from './relations.js'
 * ```
 *
 * And pass to createDb / drizzle():
 * ```ts
 * import * as schema from './schema.js'
 * const db = drizzle(client, { schema })
 * ```
 */

// ─── Re-export Drizzle's relations helper for convenience ────────────
export { relations } from 'drizzle-orm'

// ─── Scaffold: add your cross-module relations below ─────────────────
//
// import { relations } from 'drizzle-orm'
// import { users } from '../modules/auth/auth.schema.js'
// import { posts } from '../modules/blog/blog.schema.js'
//
// export const usersRelations = relations(users, ({ many }) => ({
//   posts: many(posts),
// }))
