import { DomainError } from '#shared/domain/errors/domain_error'

export class MediaNotOwnedError extends DomainError {
  constructor() {
    super('MEDIA_NOT_OWNED', 'Media not found')
  }
}
