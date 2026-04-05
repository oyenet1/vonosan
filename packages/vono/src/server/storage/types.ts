/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UploadOptions {
  /** Target key / path in the storage bucket */
  key?: string
  /** MIME type override */
  contentType?: string
  /** Whether the file should be publicly accessible */
  public?: boolean
  /** Additional metadata */
  metadata?: Record<string, string>
}

export interface UploadResult {
  /** Storage key (path) of the uploaded file */
  key: string
  /** Public URL of the uploaded file */
  url: string
  /** File size in bytes */
  size: number
  /** MIME type */
  contentType: string
}

// ─── StorageDriver interface ──────────────────────────────────────────────────

/**
 * StorageDriver — interface that all storage drivers must implement.
 *
 * @example
 * ```ts
 * const storage = useStorage(c)
 * const result = await storage.upload(file, { key: 'avatars/user-123.jpg' })
 * const url = storage.url('avatars/user-123.jpg')
 * await storage.delete('avatars/user-123.jpg')
 * ```
 */
export interface StorageDriver {
  /**
   * Upload a file to storage.
   * @param file - File object from multipart form data
   * @param options - Optional upload configuration
   */
  upload(file: File, options?: UploadOptions): Promise<UploadResult>

  /**
   * Delete a file from storage by key.
   * @param key - Storage key / path
   */
  delete(key: string): Promise<void>

  /**
   * Get the public URL for a stored file.
   * @param key - Storage key / path
   */
  url(key: string): string
}

// ─── Storage config ───────────────────────────────────────────────────────────

export interface StorageConfig {
  driver: 'local' | 'r2' | 's3' | 'cloudinary' | 'bunny'
  /** Max file size in bytes (default: 10MB) */
  maxSize?: number
  /** Allowed MIME types (default: all) */
  allowedMimeTypes?: string[]
  /** Base URL for CDN drivers */
  baseUrl?: string
  /** Local upload directory (default: ./storage/uploads) */
  uploadDir?: string
}
