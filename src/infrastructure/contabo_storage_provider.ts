import * as path from 'node:path'
import { cuid as uuidv4 } from '@adonisjs/core/helpers'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import drive from '@adonisjs/drive/services/main'
import { StorageProviderInterface } from '#shared/application/services/upload/storage_provider_interface'
import {
  FileInfo,
  MediaType,
  UploadOptions,
  UploadResult,
} from '#shared/application/services/upload/types'

export interface ContaboProviderConfig {
  /**
   * Optional base path prefix for all uploaded objects
   */
  basePath?: string

  /**
   * Optional sub-path for image objects (appended after basePath)
   */
  imageBasePath?: string

  /**
   * Optional sub-path for document objects (appended after basePath)
   */
  documentBasePath?: string
}

/**
 * Contabo Object Storage Provider
 *
 * Delegates all storage operations to the AdonisJS Drive `contabo` disk, which is
 * backed by FlyDrive's S3 driver configured in `config/drive.ts`.
 *
 * Contabo provides S3-compatible object storage with their own endpoint.
 * The backend does NOT serve these files to clients — consumers should access
 * them via the public bucket URL or a signed URL returned by this provider.
 *
 * Designed for deployment on VPS via Coolify.
 */
export class ContaboStorageProvider implements StorageProviderInterface {
  private readonly disk = drive.use('contabo')
  private readonly basePath: string
  private readonly imageBasePath: string
  private readonly documentBasePath: string

  constructor(config: ContaboProviderConfig = {}) {
    this.basePath = config.basePath ?? ''
    this.imageBasePath = config.imageBasePath ?? 'images'
    this.documentBasePath = config.documentBasePath ?? 'documents'
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async upload(
    fileInfo: FileInfo,
    file?: MultipartFile,
    _options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const fileName = this.generateFileName(fileInfo.originalName)
      const subPath = fileInfo.type === MediaType.IMAGE ? this.imageBasePath : this.documentBasePath
      const objectKey = this.buildKey(subPath, fileName)

      // Obtain the raw buffer — prefer the MultipartFile stream when available
      const body = await this.resolveBody(fileInfo, file)

      await this.disk.put(objectKey, body, {
        contentType: fileInfo.mimeType,
        contentLength: fileInfo.size,
        metadata: {
          originalName: fileInfo.originalName,
        },
      })

      const url = await this.disk.getUrl(objectKey)

      return {
        success: true,
        url,
        key: objectKey,
        metadata: {
          originalName: fileInfo.originalName,
          size: fileInfo.size,
          mimeType: fileInfo.mimeType,
          uploadedAt: new Date(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload to Contabo storage failed',
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.disk.delete(key)
      return true
    } catch {
      return false
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return this.disk.getSignedUrl(key, {
      expiresIn: expiresIn ?? 60 * 60 * 24, // default: 24 hours
    })
  }

  async exists(key: string): Promise<boolean> {
    return this.disk.exists(key)
  }

  async getMetadata(key: string): Promise<Record<string, any> | null> {
    try {
      return await this.disk.getMetaData(key)
    } catch {
      return null
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Build the full S3 object key from optional base path, sub-path and filename.
   */
  private buildKey(...segments: string[]): string {
    const parts = [this.basePath, ...segments].filter(Boolean)
    // Normalise to forward-slash separators (S3 convention)
    return parts.join('/').replace(/\\/g, '/')
  }

  /**
   * Resolve the upload body from either the raw buffer on FileInfo or the
   * MultipartFile's temporary path on disk.
   */
  private async resolveBody(fileInfo: FileInfo, file?: MultipartFile): Promise<Buffer> {
    if (fileInfo.buffer && fileInfo.buffer.length > 0) {
      return fileInfo.buffer
    }

    if (file?.tmpPath) {
      const { readFile } = await import('node:fs/promises')
      return readFile(file.tmpPath)
    }

    throw new Error('No file content available for upload: neither buffer nor tmpPath is set')
  }

  /**
   * Generate a unique filename preserving the original extension.
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now()
    const uuid = uuidv4()
    const extension = path.extname(originalName) || ''
    return `${timestamp}-${uuid}${extension}`
  }
}
