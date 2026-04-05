/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { Logger } from '../../../shared/utils/logger.js'
import type { StorageDriver, UploadOptions, UploadResult } from '../types.js'

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
  /** Upload preset (optional) */
  uploadPreset?: string
}

// ─── CloudinaryDriver ─────────────────────────────────────────────────────────

/**
 * Cloudinary image CDN driver.
 * Uses the Cloudinary Upload API (no SDK — pure fetch).
 */
export class CloudinaryDriver implements StorageDriver {
  constructor(private readonly config: CloudinaryConfig) {}

  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const url = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/auto/upload`

    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', this.config.apiKey)

    if (options?.key) {
      formData.append('public_id', options.key.replace(/\.[^.]+$/, ''))
    }

    if (this.config.uploadPreset) {
      formData.append('upload_preset', this.config.uploadPreset)
    }

    // Generate signature for authenticated upload
    const timestamp = Math.floor(Date.now() / 1000).toString()
    formData.append('timestamp', timestamp)

    const signature = await this._sign({ timestamp, public_id: options?.key })
    formData.append('signature', signature)

    const res = await fetch(url, { method: 'POST', body: formData })

    if (!res.ok) {
      const body = await res.text()
      Logger.error('[storage:cloudinary] Upload failed', { status: res.status, body })
      throw new Error(`Cloudinary upload error: ${res.status}`)
    }

    const data = await res.json() as { public_id: string; secure_url: string; bytes: number; format: string }

    Logger.info('[storage:cloudinary] File uploaded', { publicId: data.public_id })

    return {
      key: data.public_id,
      url: data.secure_url,
      size: data.bytes,
      contentType: options?.contentType ?? `image/${data.format}`,
    }
  }

  async delete(key: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = await this._sign({ public_id: key, timestamp })

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_id: key,
          api_key: this.config.apiKey,
          timestamp,
          signature,
        }),
      },
    )

    if (!res.ok) {
      Logger.error('[storage:cloudinary] Delete failed', { key, status: res.status })
      throw new Error(`Cloudinary delete error: ${res.status}`)
    }

    Logger.info('[storage:cloudinary] File deleted', { key })
  }

  url(key: string): string {
    return `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${key}`
  }

  private async _sign(params: Record<string, string | undefined>): Promise<string> {
    // Build sorted param string (exclude api_key, file, resource_type, cloud_name)
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    const toSign = `${sorted}${this.config.apiSecret}`
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(toSign))
    return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
}
