import { ErrorCategory } from '#shared/domain/errors/app_error'
import { ApplicationError } from '#shared/application/errors/application_error'

export class ConflictApplicationError extends ApplicationError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    options?: ErrorOptions
  ) {
    super(code, message, ErrorCategory.CONFLICT, details, options)
  }
}
