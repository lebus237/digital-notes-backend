import { ApplicationError } from '#shared/application/errors/application_error'

export class NotFoundApplicationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super('RESOURCE_NOT_FOUND', message, details, cause)
  }
}
