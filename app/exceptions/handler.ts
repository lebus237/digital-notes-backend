import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as vineErrors } from '@vinejs/vine'
import { DomainError } from '#shared/domain/errors/domain_error'
import { ApplicationError } from '#shared/application/errors/application_error'

const SERVER_MESSAGE: Record<number, string> = {
  404: 'Resource not found',
  409: 'Conflict',
  422: 'Unprocessable entity',
  500: 'Internal server error',
}

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * Verbose stack traces are limited to local development.
   * `stage` and `production` return sanitized payloads only.
   */
  protected debug = app.inDev

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).send({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.messages,
        },
      })
    }

    if (error instanceof DomainError || error instanceof ApplicationError) {
      const status = this.resolveStatus(error)

      ctx.logger.error({ err: error, code: error.code }, error.message)

      return ctx.response.status(status).send({
        status: 'error',
        error: {
          code: error.code,
          message: SERVER_MESSAGE[status] ?? SERVER_MESSAGE[500],
        },
      })
    }

    return super.handle(error, ctx)
  }

  private resolveStatus(error: DomainError | ApplicationError): number {
    switch (error.code) {
      case 'MEDIA_NOT_FOUND':
      case 'IMAGE_NOT_FOUND':
      case 'DOCUMENT_NOT_FOUND':
      case 'RESOURCE_NOT_FOUND':
      case 'MEDIA_NOT_OWNED':
      case 'PRODUCT_IMAGE_NOT_OWNED':
        return 404
      case 'PRODUCT_IMAGE_LIMIT_REACHED':
      case 'ORDER_STATUS_TRANSITION_INVALID':
      case 'STORE_CONFLICTING_BUSINESS_HOURS':
        return 409
      default:
        return 500
    }
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
