import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class UniversityNotFoundError extends DomainError {
  constructor() {
    super('ORGANISATION_UNIVERSITY_NOT_FOUND', 'University not found', ErrorCategory.NOT_FOUND)
  }
}
