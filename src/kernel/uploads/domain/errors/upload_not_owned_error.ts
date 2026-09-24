import { DomainError } from '#shared/domain/errors/domain_error'

export class UploadNotOwnedError extends DomainError {
  constructor() {
    super('MEDIA_NOT_OWNED', 'Media not found')
  }
}
