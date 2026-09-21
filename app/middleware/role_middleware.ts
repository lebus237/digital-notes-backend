import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type User from '#database/active-records/user'

/**
 * Minimal role gate. Usage: middleware.role({ roles: ['administrator'] })
 */
export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { roles: string[] }) {
    const user = ctx.auth.user as User | undefined

    if (!user || !options.roles.includes(user.role)) {
      return ctx.response.forbidden({
        status: 'error',
        error: { code: 'FORBIDDEN', message: 'Forbidden' },
      })
    }

    return next()
  }
}
