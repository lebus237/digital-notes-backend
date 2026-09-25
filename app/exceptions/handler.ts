import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as vineErrors } from '@vinejs/vine'
import { AppError, ErrorCategory } from '#shared/domain/errors/app_error'

const CATEGORY_STATUS: Record<ErrorCategory, number> = {
  [ErrorCategory.VALIDATION]: 422,
  [ErrorCategory.UNAUTHORIZED]: 401,
  [ErrorCategory.FORBIDDEN]: 403,
  [ErrorCategory.NOT_FOUND]: 404,
  [ErrorCategory.CONFLICT]: 409,
  [ErrorCategory.INTERNAL]: 500,
}

const LOGGABLE_CATEGORIES: ReadonlySet<ErrorCategory> = new Set([
  ErrorCategory.VALIDATION,
  ErrorCategory.UNAUTHORIZED,
  ErrorCategory.FORBIDDEN,
  ErrorCategory.NOT_FOUND,
  ErrorCategory.CONFLICT,
])

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = app.inDev

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

    if (error instanceof AppError && error.category !== ErrorCategory.INTERNAL) {
      return ctx.response.status(CATEGORY_STATUS[error.category]).send({
        status: 'error',
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      })
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      ctx.logger.warn({ code: 'VALIDATION_ERROR' }, error.message)
      return
    }

    if (error instanceof AppError && LOGGABLE_CATEGORIES.has(error.category)) {
      ctx.logger.warn({ err: error, code: error.code }, error.message)
      return
    }

    return super.report(error, ctx)
  }
}
