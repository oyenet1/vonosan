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

export interface S3Config {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  /** Public base URL (e.g. https://my-bucket.s3.amazonaws.com) */
  baseUrl?: string
}

// ─── S3Driver ────────────────────────────────────────────────────────────────

/**
 * AWS S3 storage driver using `@aws-sdk/client-s3`.
 */
export class S3Driver implements StorageDriver {
  constructor(private readonly config: S3Config) {}

  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3').catch(() => {
      throw new Error('[storage:s3] @aws-sdk/client-s3 is not installed. Run: bun add @aws-sdk/client-s3')
    })

    const ext = file.name.split('.').pop() ?? 'bin'
    const key = options?.key ?? `${generateId()}.${ext}`
    const contentType = options?.contentType ?? file.type

    const client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    })

    const buffer = await file.arrayBuffer()

    await client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: contentType,
        ACL: options?.public !== false ? 'public-read' : 'private',
      }),
    )

    Logger.info('[storage:s3] File uploaded', { key, size: file.size })
    return { key, url: this.url(key), size: file.size, contentType }
  }

  async delete(key: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3').catch(() => {
      throw new Error('[storage:s3] @aws-sdk/client-s3 is not installed.')
    })

    const client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    })

    await client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }))
    Logger.info('[storage:s3] File deleted', { key })
  }

  url(key: string): string {
    const base = this.config.baseUrl
      ? (this.config.baseUrl.endsWith('/') ? this.config.baseUrl.slice(0, -1) : this.config.baseUrl)
      : `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com`
    const normalised = key.startsWith('/') ? key.slice(1) : key
    return `${base}/${normalised}`
  }
}
