import { StorageProviderInterface } from '#shared/application/services/upload/storage_provider_interface'
import {
  FileInfo,
  MediaType,
  UploadOptions,
  UploadResult,
} from '#shared/application/services/upload/types'
import { MultipartFile } from '@adonisjs/core/bodyparser'

export interface MediaManagerInterface {
  /**
   * Switch to a different storage provider
   */
  setProvider(provider: StorageProviderInterface): void

  /**
   * Get the current storage provider
   */
  getProvider(): StorageProviderInterface

  /**
   * Upload a file with validation
   */
  uploadFile(
    fileInfo: FileInfo,
    file?: MultipartFile,
    options?: UploadOptions
  ): Promise<UploadResult>

  /**
   * Upload multiple files
   */
  // uploadMultiple(files: FileInfo[], options?: UploadOptions): Promise<UploadResult[]>

  /**
   * Upload an image with specific validation
   */
  uploadImage(
    fileInfo: FileInfo,
    file?: MultipartFile,
    options?: UploadOptions
  ): Promise<UploadResult>

  /**
   * Upload a document with specific validation
   */
  uploadDocument(
    fileInfo: FileInfo,
    file?: MultipartFile,
    options?: UploadOptions
  ): Promise<UploadResult>

  /**
   * Delete a file
   */
  deleteFile(key: string): Promise<boolean | void>

  /**
   * Get a signed URL for temporary access
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>

  /**
   * Check if a file exists
   */
  fileExists(key: string): Promise<boolean>

  /**
   * Get file metadata
   */
  getFileMetadata(key: string): Promise<Record<string, any> | null>

  /**
   * Get media type of a file
   */
  getMediaType(mimeType: string): MediaType | null
}
