import type { HttpContext } from '@adonisjs/core/http'
import { loginSchema, registerSchema } from '#validators/auth_validator'
import User from '#database/active-records/user'
import { UserRole } from '#kernel/user/domain/types/user_role'

export default class AuthController {
  async register({ request, response, logger }: HttpContext) {
    const payload = await request.validateUsing(registerSchema)

    try {
      const user = await User.create({ ...payload, role: UserRole.STUDENT })

      const accessToken = await User.accessTokens.create(user)

      return response.created({
        data: {
          accessToken: accessToken.toJSON().token,
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'auth.register failed')
      return response.abort({ message: 'Registration failed' })
    }
  }

  async login({ request, response }: HttpContext) {
    const payload = await request.validateUsing(loginSchema)

    const identifier = payload.phoneNumber || payload.email

    if (!identifier) {
      return response.badRequest({ message: 'email or phoneNumber is required' })
    }

    const user = await User.verifyCredentials(identifier, payload.password)

    const accessToken = await User.accessTokens.create(user)

    return response.ok({
      data: {
        user: {
          fullName: user?.getFullName(),
          email: user?.getEmail(),
          phoneNumber: user?.getPhoneNumber(),
          createdAt: user?.getCreatedAt(),
        },
        context: {},
        accessToken: accessToken.toJSON().token,
      },
    })
  }

  async me({ auth, response }: HttpContext) {
    await auth.authenticate()

    const user = auth.user!

    return response.ok({
      data: {
        user: {
          fullName: user?.getFullName(),
          email: user?.getEmail(),
          phoneNumber: user?.getPhoneNumber(),
          createdAt: user?.getCreatedAt(),
        },
        context: {},
      },
    })
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()
    return response.noContent()
  }
}
