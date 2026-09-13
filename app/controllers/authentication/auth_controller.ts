import type { HttpContext } from '@adonisjs/core/http'
import { loginSchema, registerSchema } from '#validators/auth_validator'
import User from '#database/active-records/user'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerSchema)

    try {
      let user = await User.create(payload)

      let accessToken = await User.accessTokens.create(user)

      return response.created({
        data: {
          accessToken: accessToken.toJSON().token,
        },
      })
    } catch (error) {
      return response.abort({ error })
    }
  }

  async login({ request, response }: HttpContext) {
    const payload = await request.validateUsing(loginSchema)

    const user = await User.verifyCredentials(payload.email, payload.password)

    let accessToken = await User.accessTokens.create(user)

    return response.ok({
      data: {
        user: {
          fullName: user?.getFullName(),
          email: user?.getEmail(),
          createdAt: user?.getCreatedAt(),
        },
        context: {},
        accessToken: accessToken.toJSON().token,
      },
    })
  }

  async me({ auth, response }: HttpContext) {
    await auth.check()

    const user = auth.user as User

    return response.ok({
      data: {
        user: {
          fullName: user?.getFullName(),
          email: user?.getEmail(),
          createdAt: user?.getCreatedAt(),
        },
        context: {},
      },
    })
  }

  async logout({ auth }: HttpContext) {
    await auth.use('api').invalidateToken()
  }
}
