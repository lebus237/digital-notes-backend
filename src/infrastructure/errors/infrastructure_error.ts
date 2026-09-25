import { AppError, ErrorCategory } from '#shared/domain/errors/app_error'

export class InfrastructureError extends AppError {
  constructor(code: string, message: string, options?: ErrorOptions) {
    super(code, message, ErrorCategory.INTERNAL, undefined, options)
  }
}
