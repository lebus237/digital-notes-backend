import type { HttpContext } from '@adonisjs/core/http'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '#validators/auth_validator'
import User from '#database/active-records/user'
import PasswordResetToken from '#database/active-records/password_reset_token'
import { UserRole } from '#kernel/user/domain/types/user_role'
import { AppId } from '#shared/domain/app_id'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import { errors as authErrors } from '@adonisjs/auth'

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function generateTemporaryPassword(): string {
  return `${crypto.randomBytes(6).toString('base64url')}A1a`
}

async function revokeAllTokens(userId: crypto.UUID, client: { from: typeof db.from } = db) {
  await client.from('auth_access_tokens').where('tokenable_id', userId).delete()
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

  async forgotPassword({ request, response }: HttpContext) {
    const payload = await request.validateUsing(forgotPasswordSchema)

    const identifier = payload.phoneNumber || payload.email

    if (!identifier) {
      return response.badRequest({ message: 'email or phoneNumber is required' })
    }

    const message = 'If an account exists, a password reset token has been issued'

    const user = await User.findForAuth(
      payload.phoneNumber ? ['phoneNumber'] : ['email'],
      identifier
    )

    if (!user) {
      return response.ok({ data: { message } })
    }

    const token = generateResetToken()

    let resetToken!: PasswordResetToken
    await db.transaction(async (trx) => {
      await User.query({ client: trx }).where('id', user.id).forUpdate().firstOrFail()
      await PasswordResetToken.query({ client: trx })
        .where('userId', user.id)
        .whereNull('usedAt')
        .delete()
      resetToken = await PasswordResetToken.create(
        {
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: DateTime.utc().plus({ hour: 1 }),
        },
        { client: trx }
      )
    })

    return response.ok({
      data: {
        message,
        resetToken: token,
        expiresAt: resetToken.expiresAt.toISO(),
      },
    })
  }

  async resetPassword({ request, response, logger }: HttpContext) {
    const payload = await request.validateUsing(resetPasswordSchema)

    let succeeded = false

    try {
      await db.transaction(async (trx) => {
        const resetToken = await PasswordResetToken.query({ client: trx })
          .where('tokenHash', hashResetToken(payload.token))
          .whereNull('usedAt')
          .where('expiresAt', '>', DateTime.utc().toJSDate())
          .forUpdate()
          .first()

        if (!resetToken) {
          return
        }

        const user = await User.findOrFail(resetToken.userId, { client: trx })
        user.password = payload.password
        await user.save()

        resetToken.usedAt = DateTime.utc()
        await resetToken.save()

        await PasswordResetToken.query({ client: trx })
          .where('userId', user.id)
          .whereNot('id', resetToken.id)
          .delete()

        await revokeAllTokens(user.id, trx)

        succeeded = true
      })
    } catch (error) {
      logger.error({ err: error }, 'auth.resetPassword failed')
      return response.abort({ message: 'Password reset failed' })
    }

    if (!succeeded) {
      return response.badRequest({ message: 'Invalid or expired reset token' })
    }

    return response.ok({ data: { message: 'Password has been reset' } })
  }

  async changePassword({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(changePasswordSchema)

    await auth.authenticate()
    const user = auth.user!

    const identifier = user.email || user.phoneNumber

    try {
      await User.verifyCredentials(identifier, payload.currentPassword)
    } catch (error) {
      if (authErrors.E_INVALID_CREDENTIALS.isError(error)) {
        return response.unauthorized({ message: 'Current password is incorrect' })
      }
      throw error
    }

    user.password = payload.newPassword
    await user.save()

    await revokeAllTokens(user.id)

    return response.noContent()
  }

  async adminResetPassword({ request, response }: HttpContext) {
    const userId = AppId.fromString(request.param('id'))

    const user = await User.find(userId.value)

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    const temporaryPassword = generateTemporaryPassword()
    user.password = temporaryPassword
    await user.save()

    await revokeAllTokens(user.id)
    await PasswordResetToken.query().where('user_id', user.id).delete()

    return response.created({ data: { userId: user.id, temporaryPassword } })
  }
}
