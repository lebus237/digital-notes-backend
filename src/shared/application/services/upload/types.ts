// Core types for the media upload system

export enum MediaType {
  IMAGE = 'image',
  DOCUMENT = 'document',
}

export enum ImageFormat {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  WEBP = 'image/webp',
  SVG = 'image/svg+xml',
}

export enum DocumentFormat {
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  TXT = 'text/plain',
}

export type SupportedMimeType = ImageFormat | DocumentFormat

export interface UploadOptions {
  maxSizeInBytes?: number
  allowedFormats?: SupportedMimeType[]
  generateThumbnail?: boolean
  metadata?: Record<string, string>
}

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  thumbnailUrl?: string
  error?: string
  metadata?: {
    originalName: string
    size: number
    mimeType: string
    uploadedAt: Date
  }
}

export interface FileInfo {
  buffer: Buffer
  originalName: string
  mimeType: string
  size: number
  type?: MediaType
}

export interface ProviderConfig {
  provider: string
  credentials?: Record<string, any>
  bucket?: string
  region?: string
  basePath?: string
}
