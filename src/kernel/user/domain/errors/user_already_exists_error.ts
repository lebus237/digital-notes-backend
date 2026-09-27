import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class UserAlreadyExistsError extends DomainError {
  constructor() {
    super(
      'USER_ALREADY_EXISTS',
      'An account with this email or phone number already exists',
      ErrorCategory.CONFLICT
    )
  }
}
