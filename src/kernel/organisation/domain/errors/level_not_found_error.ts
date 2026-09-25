import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class LevelNotFoundError extends DomainError {
  constructor() {
    super('ORGANISATION_LEVEL_NOT_FOUND', 'Level not found', ErrorCategory.NOT_FOUND)
  }
}
