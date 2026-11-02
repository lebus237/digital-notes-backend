import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { DateTime } from 'luxon'
import type { StorageProviderInterface } from '#shared/application/services/upload/storage_provider_interface'
import type {
  FileInfo,
  UploadOptions,
  UploadResult,
} from '#shared/application/services/upload/types'

type StoredFile = {
  size: number
  mimeType: string
  contents: Buffer
}

/**
 * Storage boundary used by functional tests. Real providers talk to S3 or
 * the filesystem; tests only care that the HTTP layer hands bytes over and
 * records the resulting key, so the provider keeps everything in memory.
 */
export class InMemoryStorageProvider implements StorageProviderInterface {
  private readonly files = new Map<string, StoredFile>()
  private sequence = 0

  async upload(
    fileInfo: FileInfo,
    _file?: MultipartFile,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const folder = options?.storagePath ?? fileInfo.storagePath ?? 'uploads'
    const key = `${folder}/${++this.sequence}-${fileInfo.originalName}`

    this.files.set(key, {
      size: fileInfo.size,
      mimeType: fileInfo.mimeType,
      contents: fileInfo.buffer,
    })

    return {
      success: true,
      key,
      url: `https://storage.test/${key}`,
      metadata: {
        originalName: fileInfo.originalName,
        size: fileInfo.size,
        mimeType: fileInfo.mimeType,
        uploadedAt: DateTime.utc(),
      },
    }
  }

  async delete(key: string): Promise<boolean> {
    return this.files.delete(key)
  }

  async getSignedUrl(key: string): Promise<string> {
    return `https://storage.test/signed/${key}`
  }

  async exists(key: string): Promise<boolean> {
    return this.files.has(key)
  }

  async getMetadata(key: string): Promise<Record<string, any> | null> {
    const file = this.files.get(key)
    return file ? { size: file.size, mimeType: file.mimeType } : null
  }

  has(key: string): boolean {
    return this.files.has(key)
  }

  clear(): void {
    this.files.clear()
    this.sequence = 0
  }
}
