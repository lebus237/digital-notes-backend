import { ErrorCategory } from '#shared/domain/errors/app_error'
import { ApplicationError } from '#shared/application/errors/application_error'

export class NotFoundApplicationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>, options?: ErrorOptions) {
    super('RESOURCE_NOT_FOUND', message, ErrorCategory.NOT_FOUND, details, options)
  }
}
