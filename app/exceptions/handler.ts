import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as vineErrors } from '@vinejs/vine'
import { DomainError } from '#shared/domain/errors/domain_error'
import { ApplicationError } from '#shared/application/errors/application_error'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

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

      return ctx.response.status(status).send({
        status: 'error',
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      })
    }

    return super.handle(error, ctx)
  }

  private resolveStatus(error: DomainError | ApplicationError): number {
    switch (error.code) {
      case 'PRODUCT_IMAGE_LIMIT_REACHED':
        return 409
      case 'PRODUCT_PACK_NOT_FOUND':
      case 'RESOURCE_NOT_FOUND':
      case 'CUSTOMER_NOT_FOUND':
      case 'IMAGE_NOT_FOUND':
        return 404
      case 'ORDER_STATUS_TRANSITION_INVALID':
      case 'PRODUCT_IMAGE_NOT_OWNED':
        return 409
      case 'STORE_CONFLICTING_BUSINESS_HOURS':
        return 409
      default:
        return 422
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
