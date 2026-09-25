import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class DepartmentNotFoundError extends DomainError {
  constructor() {
    super('ORGANISATION_DEPARTMENT_NOT_FOUND', 'Department not found', ErrorCategory.NOT_FOUND)
  }
}
