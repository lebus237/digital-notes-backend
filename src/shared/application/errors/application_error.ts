import { AppError, ErrorCategory } from '#shared/domain/errors/app_error'

export class ApplicationError extends AppError {
  constructor(
    code: string,
    message: string,
    category: ErrorCategory,
    details?: Record<string, unknown>,
    options?: ErrorOptions
  ) {
    super(code, message, category, details, options)
  }
}
