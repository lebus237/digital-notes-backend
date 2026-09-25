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
import {
  DEFAULT_DOCUMENT_STORAGE_PATH,
  DEFAULT_IMAGE_STORAGE_PATH,
  resolveStorageSubPath,
} from '#shared/application/services/upload/storage_path'

/**
 * Subset of the AdonisJS Drive disk API this provider relies on.
 */
type StorageDisk = Pick<
  ReturnType<typeof drive.use>,
  'put' | 'getUrl' | 'getSignedUrl' | 'delete' | 'exists' | 'getMetaData'
>

export interface NeonProviderConfig {
  /**
   * Optional base path prefix for all uploaded objects
   */
  basePath?: string | null

  /**
   * Optional sub-path for image objects (appended after basePath)
   */
  imageBasePath?: string

  /**
   * Optional sub-path for document objects (appended after basePath)
   */
  documentBasePath?: string
}

export interface NeonProviderDisks {
  /**
   * Disk backed by the media bucket. Defaults to the `neon` drive disk.
   */
  media?: StorageDisk

  /**
   * Disk backed by the docs bucket. Defaults to the `neon_docs` drive disk.
   */
  docs?: StorageDisk
}

/**
 * Neon Object Storage Provider
 *
 * Delegates storage operations to two AdonisJS Drive disks backed by FlyDrive's
 * S3 driver (`neon` → media bucket, `neon_docs` → docs bucket), both configured
 * in `config/drive.ts` and provisioned from `neon.ts` with `neon deploy`.
 *
 * Images and documents are split across buckets because the buckets branch with
 * the Neon project: the object and its `medias` row stay in sync on every branch.
 *
 * Both buckets are private, but uploads keep the sibling providers' behaviour:
 * `upload.url` is the same unsigned endpoint the Railway/Contabo providers
 * return — it 403s for anonymous clients and is only useful as an opaque
 * reference. Real reads always go through `getSignedUrl`, which is also what
 * `POST /api/media` returns as `signedUrl`. Rows stay portable across branches
 * this way (the persisted URL never embeds an expiring signature); just never
 * hand `url` to a consumer expecting a viewable image.
 */
export class NeonStorageProvider implements StorageProviderInterface {
  private readonly mediaDisk: StorageDisk
  private readonly docsDisk: StorageDisk
  private readonly basePath: string
  private readonly imageBasePath: string
  private readonly documentBasePath: string
  private readonly imagePrefix: string
  private readonly documentPrefix: string

  constructor(config: NeonProviderConfig = {}, disks: NeonProviderDisks = {}) {
    this.mediaDisk = disks.media ?? drive.use('neon')
    this.docsDisk = disks.docs ?? drive.use('neon_docs')
    this.basePath = config.basePath ?? ''
    this.imageBasePath = config.imageBasePath ?? DEFAULT_IMAGE_STORAGE_PATH
    this.documentBasePath = config.documentBasePath ?? DEFAULT_DOCUMENT_STORAGE_PATH
    this.imagePrefix = `${this.buildKey(this.imageBasePath)}/`
    this.documentPrefix = `${this.buildKey(this.documentBasePath)}/`
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
      const isDocument = fileInfo.type === MediaType.DOCUMENT
      const disk = isDocument ? this.docsDisk : this.mediaDisk
      const subPath = resolveStorageSubPath(
        fileInfo.type,
        fileInfo.storagePath ?? _options?.storagePath,
        { image: this.imageBasePath, document: this.documentBasePath }
      )
      const fileName = this.generateFileName(fileInfo.originalName)
      const objectKey = this.buildKey(subPath, fileName)

      // Obtain the raw buffer — prefer the MultipartFile stream when available
      const body = await this.resolveBody(fileInfo, file)

      await disk.put(objectKey, body, {
        contentType: fileInfo.mimeType,
        contentLength: fileInfo.size,
        metadata: {
          originalName: fileInfo.originalName,
        },
      })

      const url = await disk.getUrl(objectKey)

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
        error: error instanceof Error ? error.message : 'Upload to Neon storage failed',
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.diskForKey(key).delete(key)
      return true
    } catch {
      return false
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return this.diskForKey(key).getSignedUrl(key, {
      expiresIn: expiresIn ?? 60 * 60 * 24, // default: 24 hours
    })
  }

  async exists(key: string): Promise<boolean> {
    return this.diskForKey(key).exists(key)
  }

  async getMetadata(key: string): Promise<Record<string, any> | null> {
    try {
      return await this.diskForKey(key).getMetaData(key)
    } catch {
      return null
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Resolve the bucket a key belongs to. The provider is the only writer of its
   * keys, so the sub-path prefix recorded at construction time is authoritative
   * for operations that only receive a key (delete, signed URL, exists, metadata).
   */
  private diskForKey(key: string): StorageDisk {
    return key.startsWith(this.documentPrefix) ? this.docsDisk : this.mediaDisk
  }

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
