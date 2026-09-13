import { ApplicationError } from '#shared/application/errors/application_error'

export class ConflictApplicationError extends ApplicationError {
  constructor(code: string, message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(code, message, details, cause)
  }
}
