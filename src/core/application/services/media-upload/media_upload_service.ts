import { StorageProviderInterface } from '#shared/application/services/upload/storage_provider_interface'
import {
  FileInfo,
  MediaType,
  UploadOptions,
  UploadResult,
} from '#shared/application/services/upload/types'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { FileValidator } from '#core/application/services/media-upload/validator'
import { MultipartFile } from '@adonisjs/core/bodyparser'

export class MediaUploadService implements MediaManagerInterface {
  private provider: StorageProviderInterface

  constructor(provider: StorageProviderInterface) {
    this.provider = provider
  }

  /**
   * Switch to a different storage provider
   */
  setProvider(provider: StorageProviderInterface): void {
    this.provider = provider
  }

  /**
   * Get the current storage provider
   */
  getProvider(): StorageProviderInterface {
    return this.provider
  }

  /**
   * Upload a file with validation
   */
  async uploadFile(
    fileInfo: FileInfo,
    file?: MultipartFile,
    options?: UploadOptions
  ): Promise<UploadResult> {
    // Validate file
    const validation = FileValidator.validate(fileInfo.mimeType, fileInfo.size, options)

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; '),
      }
    }

    // Upload using the current provider
    return await this.provider.upload(
      { ...fileInfo, type: this.getMediaType(fileInfo.mimeType) as MediaType },
      file,
      options
    )
  }

  /**
   * Upload multiple files
   */
  // async uploadMultiple(files: FileInfo[], options?: UploadOptions): Promise<UploadResult[]> {
  //   const uploadPromises = files.map((file) => this.uploadFile(file, options))
  //   return await Promise.all(uploadPromises)
  // }

  /**
   * Upload an image with specific validation
   */
  async uploadImage(
    fileInfo: FileInfo,
    file?: MultipartFile,
    options?: UploadOptions
  ): Promise<UploadResult> {
    if (!FileValidator.isImage(fileInfo.mimeType)) {
      return {
        success: false,
        error: 'File is not a valid image',
      }
    }

    return await this.uploadFile(fileInfo, file, options)
  }

  /**
   * Upload a document with specific validation
   */
  async uploadDocument(
    fileInfo: FileInfo,
    file?: MultipartFile,
    options?: UploadOptions
  ): Promise<UploadResult> {
    if (!FileValidator.isDocument(fileInfo.mimeType)) {
      return {
        success: false,
        error: 'File is not a valid document',
      }
    }

    return await this.uploadFile(fileInfo, file, options)
  }

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<boolean | void> {
    return await this.provider.delete(key)
  }

  /**
   * Get a signed URL for temporary access
   */
  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return await this.provider.getSignedUrl(key, expiresIn)
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    return await this.provider.exists(key)
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<Record<string, any> | null> {
    return await this.provider.getMetadata(key)
  }

  /**
   * Get media type of a file
   */
  getMediaType(mimeType: string): MediaType | null {
    return FileValidator.getMediaType(mimeType)
  }
}
