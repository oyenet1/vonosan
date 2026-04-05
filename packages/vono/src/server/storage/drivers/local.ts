/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { join } from 'node:path'
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { generateId } from '../../../shared/utils/id.js'
import { Logger } from '../../../shared/utils/logger.js'
import type { StorageDriver, UploadOptions, UploadResult } from '../types.js'

// ─── LocalDriver ─────────────────────────────────────────────────────────────

/**
 * Local storage driver — saves files to `./storage/uploads/`.
 * Files are served at `/uploads/<key>`.
 *
 * For development and single-server deployments only.
 */
export class LocalDriver implements StorageDriver {
  private readonly uploadDir: string
  private readonly baseUrl: string

  constructor(options?: { uploadDir?: string; baseUrl?: string }) {
    this.uploadDir = options?.uploadDir ?? join(process.cwd(), 'storage', 'uploads')
    this.baseUrl = options?.baseUrl ?? '/uploads'
  }

  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const ext = file.name.split('.').pop() ?? 'bin'
    const key = options?.key ?? `${generateId()}.${ext}`
    const filePath = join(this.uploadDir, key)

    // Ensure directory exists
    const dir = filePath.substring(0, filePath.lastIndexOf('/'))
    mkdirSync(dir, { recursive: true })

    const buffer = await file.arrayBuffer()
    writeFileSync(filePath, Buffer.from(buffer))

    Logger.info('[storage:local] File uploaded', { key, size: file.size })

    return {
      key,
      url: this.url(key),
      size: file.size,
      contentType: options?.contentType ?? file.type,
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadDir, key)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
      Logger.info('[storage:local] File deleted', { key })
    }
  }

  url(key: string): string {
    const normalised = key.startsWith('/') ? key.slice(1) : key
    return `${this.baseUrl}/${normalised}`
  }
}
