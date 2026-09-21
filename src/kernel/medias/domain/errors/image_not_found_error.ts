import { DomainError } from '#shared/domain/errors/domain_error'

export class ImageNotFoundError extends DomainError {
  constructor(imageId: string) {
    super('IMAGE_NOT_FOUND', 'Image not found', { imageId })
  }
}
