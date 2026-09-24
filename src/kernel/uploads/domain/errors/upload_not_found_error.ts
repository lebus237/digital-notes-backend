import { DomainError } from '#shared/domain/errors/domain_error'

export class UploadNotFoundError extends DomainError {
  constructor(uploadId: string) {
    super('MEDIA_NOT_FOUND', 'Media not found', { uploadId })
  }
}
