/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// vono/server — server-side helpers and middleware
export { createVonoApp } from './app-template.js'
export type { VonoAppOptions } from './app-template.js'
export { configProvider } from './middleware/configProvider.js'
export { dbProvider } from './middleware/dbProvider.js'
export { ApiResponse, success, error } from '../shared/utils/response.js'
export { buildPaginationMeta } from '../shared/utils/pagination.js'
export { generateId, prefixedId } from '../shared/utils/id.js'
export { toCamel } from '../shared/utils/mappers.js'
export { withSoftDeletes, onlyTrashed, withTrashed, softDelete, forceDelete, restore } from '../shared/utils/softDeletes.js'
export { autoRegisterRoutes } from '../shared/utils/autoRoutes.js'
export { Logger } from '../shared/utils/logger.js'
export { zodValidator } from './middleware/validator.js'
export type { ValidatorTarget, ValidationErrorBody } from './middleware/validator.js'
export { QuerySchema } from './dto/query.dto.js'
export type { QueryDto } from './dto/query.dto.js'
export {
  createRateLimiter,
  createConfiguredRateLimiters,
  authRateLimiter,
  otpRateLimiter,
  apiRateLimiter,
} from './middleware/rateLimiter.js'

// Storage
export { useStorage } from './storage/index.js'
export type { StorageDriver, StorageConfig, UploadOptions, UploadResult } from './storage/index.js'

// Jobs / Cron
export { defineJob, startJobs, runJobNow } from './jobs/index.js'
export type { JobDefinition, JobContext } from './jobs/index.js'

// Email
export { defineEmail } from './email/define-email.js'
export { sendEmail } from './email/send-email.js'
export type { EmailDefinition, RenderedEmail, EmailTemplate } from './email/define-email.js'
export type { SendEmailOptions } from './email/send-email.js'

// Resource transformers
export { BaseResource } from './resources/base-resource.js'
export type { ResourceCollection } from './resources/base-resource.js'
export { resolveStorageUrl } from './utils/storage-url.js'
export type { StorageUrlConfig } from './utils/storage-url.js'

// Authorization — Gates & Policies
export {
  registerGate,
  registerPolicy,
  checkGate,
  checkPolicy,
  can,
  authorize,
  gate,
  policy,
} from './auth/index.js'
export type { GateHandler, PolicyHandler } from './auth/index.js'
