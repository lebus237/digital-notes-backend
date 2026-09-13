import { DomainError } from '#shared/domain/errors/domain_error'

export class ImageNotFoundError extends DomainError {
  constructor(imageId: string) {
    super('IMAGE_NOT_FOUND', `Image record for id: "${imageId}" not found`, { imageId })
  }
}
