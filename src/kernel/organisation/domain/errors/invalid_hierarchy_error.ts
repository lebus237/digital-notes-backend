import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class InvalidHierarchyError extends DomainError {
  constructor(message: string = 'Invalid organisation hierarchy') {
    super('ORGANISATION_INVALID_HIERARCHY', message, ErrorCategory.VALIDATION)
  }
}
