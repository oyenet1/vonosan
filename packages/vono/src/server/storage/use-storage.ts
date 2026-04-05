/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppVariables } from '../../types/index.js'
import { Logger } from '../../shared/utils/logger.js'
import type { StorageDriver, StorageConfig, UploadOptions, UploadResult } from './types.js'
import { LocalDriver } from './drivers/local.js'

// ─── Default limits ───────────────────────────────────────────────────────────

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10 MB

// ─── StorageClient ────────────────────────────────────────────────────────────

/**
 * StorageClient — wraps a StorageDriver with validation (size + MIME type).
 */
class StorageClient {
  constructor(
    private readonly driver: StorageDriver,
    private readonly config: StorageConfig,
  ) {}

  /**
   * Upload a file with size and MIME type validation.
   *
   * @throws HTTPException 413 if file exceeds maxSize
   * @throws HTTPException 415 if MIME type is not allowed
   */
  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const maxSize = this.config.maxSize ?? DEFAULT_MAX_SIZE

    if (file.size > maxSize) {
      Logger.warn('[storage] File too large', { size: file.size, maxSize })
      throw new HTTPException(413, {
        message: `File too large. Maximum allowed size is ${Math.round(maxSize / 1024 / 1024)}MB`,
      })
    }

    const allowedMimeTypes = this.config.allowedMimeTypes
    if (allowedMimeTypes && allowedMimeTypes.length > 0) {
      const mimeType = file.type || 'application/octet-stream'
      const allowed = allowedMimeTypes.some((pattern) => {
        if (pattern.endsWith('/*')) {
          return mimeType.startsWith(pattern.slice(0, -1))
        }
        return mimeType === pattern
      })

      if (!allowed) {
        Logger.warn('[storage] MIME type not allowed', { mimeType, allowedMimeTypes })
        throw new HTTPException(415, {
          message: `File type "${mimeType}" is not allowed`,
        })
      }
    }

    return this.driver.upload(file, options)
  }

  /** Delete a file by key */
  async delete(key: string): Promise<void> {
    return this.driver.delete(key)
  }

  /** Get the public URL for a stored file */
  url(key: string): string {
    return this.driver.url(key)
  }
}

// ─── useStorage ───────────────────────────────────────────────────────────────

/**
 * `useStorage(c)` — returns a storage client for the configured driver.
 *
 * Driver selection is based on environment variables:
 * - `R2_BUCKET_NAME` → R2
 * - `S3_BUCKET` → S3
 * - `CLOUDINARY_URL` → Cloudinary
 * - `BUNNY_STORAGE_ZONE` → Bunny.net
 * - Fallback → Local
 *
 * @example
 * ```ts
 * const storage = useStorage(c)
 * const file = await c.req.parseBody()['file'] as File
 * const result = await storage.upload(file, { key: `avatars/${userId}.jpg` })
 * return c.json({ url: result.url })
 * ```
 */
export async function useStorage(
  c: Context<{ Variables: AppVariables }>,
  overrideConfig?: Partial<StorageConfig>,
): Promise<StorageClient> {
  const config = c.var.config as Record<string, string>

  const storageConfig: StorageConfig = {
    driver: 'local',
    maxSize: DEFAULT_MAX_SIZE,
    ...overrideConfig,
  }

  let driver: StorageDriver

  // R2
  if (config['R2_BUCKET_NAME'] && config['CLOUDFLARE_ACCOUNT_ID']) {
    storageConfig.driver = 'r2'
    const { R2Driver } = await import('./drivers/r2.js')
    driver = new R2Driver({
      accountId: config['CLOUDFLARE_ACCOUNT_ID'],
      accessKeyId: config['R2_ACCESS_KEY_ID'] ?? '',
      secretAccessKey: config['R2_SECRET_ACCESS_KEY'] ?? '',
      bucketName: config['R2_BUCKET_NAME'],
      baseUrl: overrideConfig?.baseUrl ?? config['R2_PUBLIC_URL'] ?? '',
    })
  }
  // S3
  else if (config['S3_BUCKET']) {
    storageConfig.driver = 's3'
    const { S3Driver } = await import('./drivers/s3.js')
    driver = new S3Driver({
      bucket: config['S3_BUCKET'],
      region: config['S3_REGION'] ?? 'us-east-1',
      accessKeyId: config['S3_ACCESS_KEY'] ?? '',
      secretAccessKey: config['S3_SECRET_KEY'] ?? '',
      baseUrl: overrideConfig?.baseUrl,
    })
  }
  // Cloudinary
  else if (config['CLOUDINARY_URL']) {
    storageConfig.driver = 'cloudinary'
    // Parse CLOUDINARY_URL: cloudinary://api_key:api_secret@cloud_name
    const url = new URL(config['CLOUDINARY_URL'])
    const { CloudinaryDriver } = await import('./drivers/cloudinary.js')
    driver = new CloudinaryDriver({
      cloudName: url.hostname,
      apiKey: url.username,
      apiSecret: url.password,
    })
  }
  // Bunny.net
  else if (config['BUNNY_STORAGE_ZONE']) {
    storageConfig.driver = 'bunny'
    const { BunnyDriver } = await import('./drivers/bunny.js')
    driver = new BunnyDriver({
      storageZone: config['BUNNY_STORAGE_ZONE'],
      accessKey: config['BUNNY_ACCESS_KEY'] ?? '',
      cdnUrl: overrideConfig?.baseUrl ?? config['BUNNY_CDN_URL'] ?? '',
    })
  }
  // Local fallback
  else {
    storageConfig.driver = 'local'
    driver = new LocalDriver({
      uploadDir: overrideConfig?.uploadDir,
      baseUrl: overrideConfig?.baseUrl,
    })
  }

  return new StorageClient(driver, storageConfig)
}
