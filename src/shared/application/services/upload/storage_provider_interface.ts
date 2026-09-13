import { FileInfo, UploadResult, UploadOptions } from '#shared/application/services/upload/types'
import { MultipartFile } from '@adonisjs/core/bodyparser'

/**
 * Storage Provider Interface
 * All storage providers must implement this interface
 */
export interface StorageProviderInterface {
  /**
   * Upload a file to the storage provider
   */
  upload(fileInfo: FileInfo, file?: MultipartFile, options?: UploadOptions): Promise<UploadResult>

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<boolean | void>

  /**
   * Get a signed URL for temporary access
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>

  /**
   * Get file metadata
   */
  getMetadata(key: string): Promise<Record<string, any> | null>
}
