import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class UploadNotFoundError extends DomainError {
  constructor(_uploadId?: string) {
    // uploadId is accepted for server-side logging at the throw site but
    // never echoed to clients (handler strips details).
    super('MEDIA_NOT_FOUND', 'Media not found', ErrorCategory.NOT_FOUND)
  }
}
