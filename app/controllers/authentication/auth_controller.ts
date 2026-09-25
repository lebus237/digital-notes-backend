import type { HttpContext } from '@adonisjs/core/http'
import { loginSchema, registerSchema } from '#validators/auth_validator'
import User from '#database/active-records/user'
import { UserRole } from '#kernel/user/domain/types/user_role'

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

export default class AuthController {
  async register({ request, response, logger }: HttpContext) {
    const payload = await request.validateUsing(registerSchema)

    try {
      const user = await User.create({ ...payload, role: UserRole.STUDENT })

      try {
        const accessToken = await User.accessTokens.create(user)

        return response.created({
          data: {
            accessToken: accessToken.toJSON().token,
          },
        })
      } catch (tokenError) {
        /*
         * The user row was persisted but the token was not. Roll the user
         * back so a failed registration never leaves an orphan account
         * that would block retries with the same email/phone number.
         */
        await User.query().where('id', user.id).delete()
        throw tokenError
      }
    } catch (error) {
      logger.error({ err: error }, 'auth.register failed')

      if (isUniqueViolation(error)) {
        return response.status(409).json({
          message: 'An account with this email or phone number already exists',
        })
      }

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
