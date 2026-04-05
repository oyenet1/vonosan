/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { generateId } from '../../../shared/utils/id.js'
import { Logger } from '../../../shared/utils/logger.js'
import type { StorageDriver, UploadOptions, UploadResult } from '../types.js'

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  /** Public CDN base URL (e.g. https://pub-xxx.r2.dev) */
  baseUrl: string
}

// ─── R2Driver ────────────────────────────────────────────────────────────────

/**
 * Cloudflare R2 storage driver — uses the S3-compatible API.
 *
 * Requires `@aws-sdk/client-s3` for the S3-compatible upload.
 * R2 endpoint: `https://<accountId>.r2.cloudflarestorage.com`
 */
export class R2Driver implements StorageDriver {
  constructor(private readonly config: R2Config) {}

  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3').catch(() => {
      throw new Error('[storage:r2] @aws-sdk/client-s3 is not installed. Run: bun add @aws-sdk/client-s3')
    })

    const ext = file.name.split('.').pop() ?? 'bin'
    const key = options?.key ?? `${generateId()}.${ext}`
    const contentType = options?.contentType ?? file.type

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    })

    const buffer = await file.arrayBuffer()

    await client.send(
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: contentType,
      }),
    )

    Logger.info('[storage:r2] File uploaded', { key, size: file.size })

    return { key, url: this.url(key), size: file.size, contentType }
  }

  async delete(key: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3').catch(() => {
      throw new Error('[storage:r2] @aws-sdk/client-s3 is not installed.')
    })

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    })

    await client.send(new DeleteObjectCommand({ Bucket: this.config.bucketName, Key: key }))
    Logger.info('[storage:r2] File deleted', { key })
  }

  url(key: string): string {
    const base = this.config.baseUrl.endsWith('/') ? this.config.baseUrl.slice(0, -1) : this.config.baseUrl
    const normalised = key.startsWith('/') ? key.slice(1) : key
    return `${base}/${normalised}`
  }
}
