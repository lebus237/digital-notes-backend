import * as path from 'node:path'
import {
  FileInfo,
  MediaType,
  UploadOptions,
  UploadResult,
} from '#shared/application/services/upload/types'
import { cuid as uuidv4 } from '@adonisjs/core/helpers'
import { StorageProviderInterface } from '#shared/application/services/upload/storage_provider_interface'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import drive from '@adonisjs/drive/services/main'

export interface LocalProviderConfig {
  storagePath: string
  baseUrl: string
  basePath?: string
  imageBasePath?: string
  documentBasePath?: string
}

export class LocalStorageProvider implements StorageProviderInterface {
  private storagePath: string
  private basePath?: string
  private imageBasePath?: string
  private documentBasePath?: string
  private diskDriver = drive.use()

  constructor(config: LocalProviderConfig) {
    this.storagePath = config.storagePath
    this.basePath = config.basePath
    this.imageBasePath = config.imageBasePath
    this.documentBasePath = config.documentBasePath
    // this.ensureStorageDirectory()
  }

  private async ensureStorageDirectory(): Promise<void> {
    // const fullPath = path.join(this.storagePath, this.basePath)
    // try {
    //   await fs.access(fullPath)
    // } catch {
    //   await fs.mkdir(fullPath, { recursive: true })
    // }
  }

  async upload(
    fileInfo: FileInfo,
    file: MultipartFile,
    _options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const fileName = this.generateFileName(fileInfo.originalName)
      const relativeKey = path.join(
        fileInfo.type === MediaType.IMAGE
          ? (this.imageBasePath as string)
          : (this.documentBasePath as string),
        fileName
      )

      // Write file
      await file.moveToDisk(relativeKey)

      const url = file.meta.url

      return {
        success: true,
        url,
        key: relativeKey,
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
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.diskDriver.delete(key)
      return true
    } catch {
      return false
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return await this.diskDriver.getSignedUrl(key, {
      expiresIn: expiresIn || 60 * 60 * 24 * 30,
    })
  }

  async exists(key: string): Promise<boolean> {
    return await this.diskDriver.exists(key)
  }

  async getMetadata(key: string): Promise<Record<string, any> | null> {
    return await this.diskDriver.getMetaData(key)
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now()
    const uuid = uuidv4()
    const extension = originalName.split('.').pop()
    return `${timestamp}-${uuid}.${extension}`
  }
}
