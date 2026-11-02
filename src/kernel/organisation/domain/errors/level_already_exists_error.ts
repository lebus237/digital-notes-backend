import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class LevelAlreadyExistsError extends DomainError {
  constructor() {
    super(
      'ORGANISATION_LEVEL_ALREADY_EXISTS',
      'A level for this year already exists in this department',
      ErrorCategory.CONFLICT
    )
  }
}
