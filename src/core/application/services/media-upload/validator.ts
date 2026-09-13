import {
  MediaType,
  ImageFormat,
  DocumentFormat,
  SupportedMimeType,
  UploadOptions,
} from '#shared/application/services/upload/types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class FileValidator {
  private static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB

  private static readonly IMAGE_FORMATS = Object.values(ImageFormat)
  private static readonly DOCUMENT_FORMATS = Object.values(DocumentFormat)

  private static readonly ALL_FORMATS = [
    ...FileValidator.IMAGE_FORMATS,
    ...FileValidator.DOCUMENT_FORMATS,
  ]

  /**
   * Validate a file against the provided options
   */
  static validate(mimeType: string, size: number, options?: UploadOptions): ValidationResult {
    const errors: string[] = []

    // Validate MIME type
    const allowedFormats = options?.allowedFormats || FileValidator.ALL_FORMATS
    if (!allowedFormats.includes(mimeType as SupportedMimeType)) {
      errors.push(
        `File type '${mimeType}' is not allowed. Allowed types: ${allowedFormats.join(', ')}`
      )
    }

    // Validate file size
    const maxSize = options?.maxSizeInBytes || FileValidator.DEFAULT_MAX_SIZE
    if (size > maxSize) {
      errors.push(`File size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Determine media type from MIME type
   */
  static getMediaType(mimeType: string): MediaType | null {
    if (FileValidator.IMAGE_FORMATS.includes(mimeType as ImageFormat)) {
      return MediaType.IMAGE
    }
    if (FileValidator.DOCUMENT_FORMATS.includes(mimeType as DocumentFormat)) {
      return MediaType.DOCUMENT
    }
    return null
  }

  /**
   * Check if a MIME type is an image
   */
  static isImage(mimeType: string): boolean {
    return FileValidator.IMAGE_FORMATS.includes(mimeType as ImageFormat)
  }

  /**
   * Check if a MIME type is a document
   */
  static isDocument(mimeType: string): boolean {
    return FileValidator.DOCUMENT_FORMATS.includes(mimeType as DocumentFormat)
  }

  /**
   * Get file extension from MIME type
   */
  static getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt',
    }
    return mimeToExt[mimeType] || 'bin'
  }
}
