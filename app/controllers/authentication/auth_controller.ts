import type { HttpContext } from '@adonisjs/core/http'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '#validators/auth_validator'
import User from '#database/active-records/user'
import PasswordResetToken from '#database/active-records/password_reset_token'
import RefreshToken from '#database/active-records/refresh_token'
import EmailVerificationToken from '#database/active-records/email_verification_token'
import { UserRole } from '#kernel/user/domain/types/user_role'
import { AppId } from '#shared/domain/app_id'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import { errors as authErrors } from '@adonisjs/auth'
import mailService from '#infra/mail/mail_service'
import env from '#start/env'

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function hashResetToken(token: string): string {
  return hashToken(token)
}

function generateOpaqueToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('hex')
}

function generateResetToken(): string {
  return generateOpaqueToken(32)
}

function generateTemporaryPassword(): string {
  return `${crypto.randomBytes(6).toString('base64url')}A1a`
}

/** Short-lived access token TTL; refresh tokens live 30 days. */
const ACCESS_TOKEN_TTL = '15 minutes'
const REFRESH_TOKEN_TTL = { days: 30 }

function serializeUser(user: User) {
  return {
    id: user.id,
    fullName: user?.getFullName(),
    email: user?.getEmail(),
    phoneNumber: user?.getPhoneNumber(),
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user?.getCreatedAt(),
  }
}

async function revokeAllTokens(userId: crypto.UUID, client: { from: typeof db.from } = db) {
  await client.from('auth_access_tokens').where('tokenable_id', userId).delete()
  await client.from('refresh_tokens').where('user_id', userId).delete()
}

async function revokeRefreshTokenByValue(refreshToken: string): Promise<void> {
  await RefreshToken.query()
    .where('tokenHash', hashToken(refreshToken))
    .whereNull('revokedAt')
    .delete()
}

/**
 * Issue a new access + refresh pair. Refresh tokens are opaque random
 * strings stored as sha256 hashes (same pattern as password-reset tokens)
 * so a DB leak never exposes usable tokens. Rotation happens in `refresh`.
 */
async function issueSession(user: User): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await User.accessTokens.create(user, undefined, {
    expiresIn: ACCESS_TOKEN_TTL,
  })
  const refreshToken = generateOpaqueToken()

  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: DateTime.utc().plus(REFRESH_TOKEN_TTL),
  })

  return {
    accessToken: accessToken.toJSON().token as string,
    refreshToken,
  }
}

async function issueEmailVerification(user: User): Promise<void> {
  const token = generateOpaqueToken(32)

  await EmailVerificationToken.query().where('userId', user.id).whereNull('usedAt').delete()
  await EmailVerificationToken.create({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: DateTime.utc().plus({ hours: 24 }),
  })

  const verifyUrl = `${(env.get('APP_WEB_URL') ?? 'http://localhost:3000').replace(/\/$/, '')}/verify-email?token=${token}`
  await mailService.sendEmailVerification(user.email, verifyUrl)
}

export default class AuthController {
  async register({ request, response, logger }: HttpContext) {
    const payload = await request.validateUsing(registerSchema)

    try {
      const user = await User.create({ ...payload, role: UserRole.STUDENT })

      try {
        const session = await issueSession(user)

        try {
          await issueEmailVerification(user)
        } catch (verificationError) {
          logger.error(
            { err: verificationError, userId: user.id },
            'auth.register verification email failed'
          )
        }

        return response.created({
          data: {
            user: serializeUser(user),
            context: {},
            ...session,
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

    const session = await issueSession(user)

    return response.ok({
      data: {
        user: serializeUser(user),
        context: {},
        ...session,
      },
    })
  }

  /**
   * Rotate a refresh token into a fresh access + refresh pair.
   * The presented token is single-use: it is deleted before the new pair
   * is issued, so replay of a stolen token fails closed after first use.
   */
  async refresh({ request, response }: HttpContext) {
    const { refreshToken } = await request.validateUsing(refreshTokenSchema)

    const stored = await RefreshToken.query()
      .where('tokenHash', hashToken(refreshToken))
      .whereNull('revokedAt')
      .where('expiresAt', '>', DateTime.utc().toJSDate())
      .forUpdate()
      .first()

    if (!stored) {
      return response.unauthorized({ message: 'Invalid or expired refresh token' })
    }

    const user = await User.find(stored.userId)

    if (!user) {
      await stored.delete()
      return response.unauthorized({ message: 'Invalid or expired refresh token' })
    }

    // Single-use rotation: consume the old token first.
    await stored.delete()

    // Opportunistic cleanup; never fail the refresh because of it.
    try {
      await RefreshToken.query()
        .where('userId', user.id)
        .where('expiresAt', '<=', DateTime.utc().toJSDate())
        .delete()
    } catch {
      // ignore
    }

    const session = await issueSession(user)

    return response.ok({
      data: {
        user: serializeUser(user),
        context: {},
        ...session,
      },
    })
  }

  async me({ auth, response }: HttpContext) {
    await auth.authenticate()

    const user = auth.user!

    return response.ok({
      data: {
        user: serializeUser(user),
        context: {},
      },
    })
  }

  async logout({ auth, request, response }: HttpContext) {
    const { refreshToken } = await request.validateUsing(logoutSchema).catch(() => ({
      refreshToken: undefined as string | undefined,
    }))

    await auth.use('api').invalidateToken()

    try {
      if (refreshToken) {
        await revokeRefreshTokenByValue(refreshToken)
      }
    } catch {
      // Access token is already revoked; refresh revocation is best-effort.
    }

    return response.noContent()
  }

  async forgotPassword({ request, response, logger }: HttpContext) {
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

    await db.transaction(async (trx) => {
      await User.query({ client: trx }).where('id', user.id).forUpdate().firstOrFail()
      await PasswordResetToken.query({ client: trx })
        .where('userId', user.id)
        .whereNull('usedAt')
        .delete()
      await PasswordResetToken.create(
        {
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: DateTime.utc().plus({ hour: 1 }),
        },
        { client: trx }
      )
    })

    /*
     * The token must never travel in the HTTP response: knowing an email or
     * phone number would be enough to take over the account. It is delivered
     * through SMTP when configured, with a development log fallback.
     */
    const resetUrl = `${(env.get('APP_WEB_URL') ?? 'http://localhost:3000').replace(/\/$/, '')}/reset-password?token=${token}`

    try {
      await mailService.sendPasswordReset(user.email, resetUrl)
    } catch (error) {
      logger.error({ err: error, userId: user.id }, 'auth.forgotPassword mail delivery failed')
    }

    return response.ok({ data: { message } })
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

  async verifyEmail({ request, response, logger }: HttpContext) {
    const payload = await request.validateUsing(verifyEmailSchema)

    let verified = false

    try {
      await db.transaction(async (trx) => {
        const record = await EmailVerificationToken.query({ client: trx })
          .where('tokenHash', hashToken(payload.token))
          .where('expiresAt', '>', DateTime.utc().toJSDate())
          .forUpdate()
          .first()

        if (!record) return

        const user = await User.findOrFail(record.userId, { client: trx })

        /*
         * Verification links are idempotent. A browser can execute the page
         * twice (React StrictMode, reload, link prefetch), and a used token
         * must not turn a successful verification into an error screen.
         */
        if (record.usedAt) {
          verified = Boolean(user.emailVerifiedAt)
          return
        }

        user.emailVerifiedAt = DateTime.utc()
        await user.save()

        record.usedAt = DateTime.utc()
        await record.save()

        await EmailVerificationToken.query({ client: trx })
          .where('userId', user.id)
          .whereNot('id', record.id)
          .delete()

        verified = true
      })
    } catch (error) {
      logger.error({ err: error }, 'auth.verifyEmail failed')
      return response.abort({ message: 'Email verification failed' })
    }

    if (!verified) {
      return response.badRequest({ message: 'Invalid or expired verification token' })
    }

    return response.ok({ data: { message: 'Email verified', emailVerified: true } })
  }

  async resendVerification({ auth, response, logger }: HttpContext) {
    await auth.authenticate()
    const user = auth.user as User

    if (user.emailVerifiedAt) {
      return response.ok({ data: { message: 'Email already verified', emailVerified: true } })
    }

    try {
      await issueEmailVerification(user)
      return response.ok({
        data: { message: 'Verification email sent', emailVerified: false },
      })
    } catch (error) {
      logger.error({ err: error, userId: user.id }, 'auth.resendVerification failed')
      return response.abort({ message: 'Could not send the verification email' })
    }
  }

  async changePassword({ auth, request, response }: HttpContext) {    const payload = await request.validateUsing(changePasswordSchema)

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
