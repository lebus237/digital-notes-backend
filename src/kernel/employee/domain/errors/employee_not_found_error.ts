import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class EmployeeNotFoundError extends DomainError {
  constructor() {
    super('EMPLOYEE_NOT_FOUND', 'Employee not found', ErrorCategory.NOT_FOUND)
  }
}
