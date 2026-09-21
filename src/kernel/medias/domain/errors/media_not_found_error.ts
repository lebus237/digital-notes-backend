import { DomainError } from '#shared/domain/errors/domain_error'

export class MediaNotFoundError extends DomainError {
  constructor(mediaId: string) {
    super('MEDIA_NOT_FOUND', 'Media not found', { mediaId })
  }
}
