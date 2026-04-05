/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Mixins ─────────────────────────────────────────────────────────
export { timestamps } from './mixins/timestamps.js'
export { softDeletable } from './mixins/softDeletable.js'

// ─── DB factory ─────────────────────────────────────────────────────
export { createDb } from './db/createDb.js'
export type { DbClient } from './db/createDb.js'

// ─── Pooling strategies ──────────────────────────────────────────────
export {
  createSharedPool,
  createHyperdrivePool,
  createHttpServerlessPool,
  resolvePoolingStrategy,
} from './db/pooling.js'
export type { PoolingStrategy, PooledDbResult } from './db/pooling.js'

// ─── Relations scaffold ──────────────────────────────────────────────
export { relations } from './db/relations.js'

// ─── Schema barrel generator ─────────────────────────────────────────
export { generateSchemaBarrel } from './db/schema-barrel.js'
export type { SchemaBarrelOptions } from './db/schema-barrel.js'
