import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class UploadNotOwnedError extends DomainError {
  constructor() {
    // Intentionally identical to UploadNotFoundError: missing vs not-owned
    // must be indistinguishable (single code + 404) to close the oracle.
    super('MEDIA_NOT_FOUND', 'Media not found', ErrorCategory.NOT_FOUND)
  }
}
