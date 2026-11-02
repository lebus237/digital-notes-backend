import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class SemesterAlreadyExistsError extends DomainError {
  constructor() {
    super(
      'ORGANISATION_SEMESTER_ALREADY_EXISTS',
      'A semester with this name already exists in this department',
      ErrorCategory.CONFLICT
    )
  }
}
