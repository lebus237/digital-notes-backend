import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class SemesterNotFoundError extends DomainError {
  constructor() {
    super('ORGANISATION_SEMESTER_NOT_FOUND', 'Semester not found', ErrorCategory.NOT_FOUND)
  }
}
