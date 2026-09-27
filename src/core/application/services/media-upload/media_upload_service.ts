import { fileTypeFromBuffer } from 'file-type'
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
    // 1. Verify bytes server-side: magic-byte sniffing beats the client-supplied
    // multipart Content-Type. file-type returns undefined for plain-text and
    // some office formats, which fall through to the allowlist + extension
    // check below instead of hard-failing.
    let effectiveMime = fileInfo.mimeType
    try {
      if (fileInfo.buffer && fileInfo.buffer.length > 0) {
        const detected = await fileTypeFromBuffer(fileInfo.buffer)
        if (detected) {
          if (detected.mime !== fileInfo.mimeType) {
            return {
              success: false,
              error: `MIME mismatch: claimed '${fileInfo.mimeType}' but content is '${detected.mime}'`,
            }
          }
          effectiveMime = detected.mime
        }
      }
    } catch {
      return { success: false, error: 'Could not verify file content' }
    }

    // 2. Extension ↔ MIME consistency (case-insensitive, jpg/jpeg aliased).
    const claimedExt = fileInfo.originalName.split('.').pop()?.toLowerCase() ?? ''
    const expectedExt = FileValidator.getExtensionFromMimeType(effectiveMime)
    if (expectedExt !== 'bin' && claimedExt && claimedExt !== expectedExt) {
      const aliasOk =
        (expectedExt === 'jpg' && claimedExt === 'jpeg') ||
        (expectedExt === 'jpeg' && claimedExt === 'jpg')
      if (!aliasOk) {
        return {
          success: false,
          error: `Extension '.${claimedExt}' does not match MIME '${effectiveMime}' (expected '.${expectedExt}')`,
        }
      }
    }

    // 3. Allowlist + size check on the verified MIME.
    const validation = FileValidator.validate(effectiveMime, fileInfo.size, options)

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; '),
      }
    }

    // Upload using the current provider with the verified MIME type.
    return await this.provider.upload(
      {
        ...fileInfo,
        mimeType: effectiveMime,
        type: this.getMediaType(effectiveMime) as MediaType,
      },
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
