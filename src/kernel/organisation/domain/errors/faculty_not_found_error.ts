import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class FacultyNotFoundError extends DomainError {
  constructor() {
    super('ORGANISATION_FACULTY_NOT_FOUND', 'Faculty not found', ErrorCategory.NOT_FOUND)
  }
}
