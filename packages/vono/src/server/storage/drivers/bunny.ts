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

export interface BunnyConfig {
  storageZone: string
  accessKey: string
  /** CDN pull zone URL (e.g. https://myzone.b-cdn.net) */
  cdnUrl: string
  /** Storage region (default: de) */
  region?: string
}

// ─── BunnyDriver ─────────────────────────────────────────────────────────────

/**
 * Bunny.net CDN storage driver.
 * Uses the Bunny Storage REST API — no SDK, pure fetch.
 *
 * Docs: https://docs.bunny.net/reference/storage-api
 */
export class BunnyDriver implements StorageDriver {
  private readonly storageEndpoint: string

  constructor(private readonly config: BunnyConfig) {
    const region = config.region ?? 'de'
    // Main region uses storage.bunnycdn.com; others use <region>.storage.bunnycdn.com
    this.storageEndpoint = region === 'de'
      ? 'https://storage.bunnycdn.com'
      : `https://${region}.storage.bunnycdn.com`
  }

  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const ext = file.name.split('.').pop() ?? 'bin'
    const key = options?.key ?? `${generateId()}.${ext}`
    const contentType = options?.contentType ?? file.type

    const uploadUrl = `${this.storageEndpoint}/${this.config.storageZone}/${key}`
    const buffer = await file.arrayBuffer()

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        AccessKey: this.config.accessKey,
        'Content-Type': contentType,
      },
      body: buffer,
    })

    if (!res.ok) {
      const body = await res.text()
      Logger.error('[storage:bunny] Upload failed', { status: res.status, body })
      throw new Error(`Bunny.net upload error: ${res.status}`)
    }

    Logger.info('[storage:bunny] File uploaded', { key, size: file.size })

    return { key, url: this.url(key), size: file.size, contentType }
  }

  async delete(key: string): Promise<void> {
    const deleteUrl = `${this.storageEndpoint}/${this.config.storageZone}/${key}`

    const res = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: { AccessKey: this.config.accessKey },
    })

    if (!res.ok) {
      Logger.error('[storage:bunny] Delete failed', { key, status: res.status })
      throw new Error(`Bunny.net delete error: ${res.status}`)
    }

    Logger.info('[storage:bunny] File deleted', { key })
  }

  url(key: string): string {
    const base = this.config.cdnUrl.endsWith('/') ? this.config.cdnUrl.slice(0, -1) : this.config.cdnUrl
    const normalised = key.startsWith('/') ? key.slice(1) : key
    return `${base}/${normalised}`
  }
}
