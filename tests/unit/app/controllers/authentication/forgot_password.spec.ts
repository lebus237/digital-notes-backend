import { test } from '@japa/runner'
import AuthController from '#controllers/authentication/auth_controller'
import User from '#database/active-records/user'
import PasswordResetToken from '#database/active-records/password_reset_token'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

test.group('forgotPassword identifier lookup', () => {
  test('phoneNumber attribute resolves to phone_number column', ({ assert }) => {
    User.boot()
    assert.equal(User.$keys.attributesToColumns.resolve('phoneNumber'), 'phone_number')
    assert.equal(User.$keys.attributesToColumns.resolve('email'), 'email')

    const sql = User.query().where('phoneNumber', '0712345678').toQuery()
    assert.include(sql, 'phone_number')
  })

  test('email attribute resolves to email column', ({ assert }) => {
    const sql = User.query().where('email', 'a@example.com').toQuery()
    assert.include(sql, 'email')
  })

  test('reset token expiry uses attribute space', ({ assert }) => {
    PasswordResetToken.boot()
    assert.equal(PasswordResetToken.$keys.attributesToColumns.resolve('expiresAt'), 'expires_at')
    const sql = PasswordResetToken.query()
      .where('expiresAt', '>', DateTime.utc().toJSDate())
      .toQuery()
    assert.include(sql, 'expires_at')
  })
})

test.group('forgotPassword controller', () => {
  test('forgot-by-phone looks up phoneNumber uid inside a transaction', async ({ assert }) => {
    const calls: Record<string, any> = {}
    const fakeTrx = { __forgotTx: true }
    const fakeExpiresAt = DateTime.utc().plus({ hour: 1 })

    const origFindForAuth = User.findForAuth
    const origTransaction = db.transaction
    const origUserQuery = User.query
    const origTokenQuery = PasswordResetToken.query
    const origCreate = PasswordResetToken.create

    try {
      // @ts-expect-error stubbing static for test
      User.findForAuth = async (uids: string[], value: string) => {
        calls.uids = uids
        calls.value = value
        return { id: 'user-1' }
      }
      // @ts-expect-error stubbing transaction runner for test
      db.transaction = async (callback: (trx: unknown) => unknown) => {
        calls.inTransaction = true
        return callback(fakeTrx)
      }
      // @ts-expect-error stubbing query builder for test
      User.query = (options?: { client?: unknown }) => {
        calls.userQueryClient = options?.client
        return {
          where: () => ({
            forUpdate: () => ({ firstOrFail: async () => ({ id: 'user-1' }) }),
          }),
        }
      }
      // @ts-expect-error stubbing query builder for test
      PasswordResetToken.query = (options?: { client?: unknown }) => {
        calls.tokenQueryClient = options?.client
        return { where: () => ({ whereNull: () => ({ delete: async () => 1 }) }) }
      }
      // @ts-expect-error stubbing create for test
      PasswordResetToken.create = async (data: any, options?: { client?: unknown }) => {
        calls.createData = data
        calls.createClient = options?.client
        return { expiresAt: fakeExpiresAt }
      }

      const controller = new AuthController()
      let body: any = null
      await controller.forgotPassword({
        request: { validateUsing: async () => ({ phoneNumber: '0712345678' }) },
        response: {
          ok: (payload: any) => {
            body = payload
            return payload
          },
          badRequest: (payload: any) => payload,
        },
      } as any)

      assert.deepEqual(calls.uids, ['phoneNumber'])
      assert.equal(calls.value, '0712345678')
      assert.isTrue(calls.inTransaction)
      assert.strictEqual(calls.userQueryClient, fakeTrx)
      assert.strictEqual(calls.tokenQueryClient, fakeTrx)
      assert.strictEqual(calls.createClient, fakeTrx)
      assert.equal(calls.createData.userId, 'user-1')
      assert.isTrue(DateTime.isDateTime(calls.createData.expiresAt))
      assert.equal(body.data.expiresAt, fakeExpiresAt.toISO())
      assert.isString(body.data.resetToken)
    } finally {
      User.findForAuth = origFindForAuth
      db.transaction = origTransaction
      User.query = origUserQuery
      PasswordResetToken.query = origTokenQuery
      PasswordResetToken.create = origCreate
    }
  })

  test('forgot-by-email looks up email uid inside a transaction', async ({ assert }) => {
    const calls: Record<string, any> = {}
    const fakeTrx = { __forgotTx: true }
    const fakeExpiresAt = DateTime.utc().plus({ hour: 1 })

    const origFindForAuth = User.findForAuth
    const origTransaction = db.transaction
    const origUserQuery = User.query
    const origTokenQuery = PasswordResetToken.query
    const origCreate = PasswordResetToken.create

    try {
      // @ts-expect-error stubbing static for test
      User.findForAuth = async (uids: string[], value: string) => {
        calls.uids = uids
        calls.value = value
        return { id: 'user-2' }
      }
      // @ts-expect-error stubbing transaction runner for test
      db.transaction = async (callback: (trx: unknown) => unknown) => {
        calls.inTransaction = true
        return callback(fakeTrx)
      }
      // @ts-expect-error stubbing query builder for test
      User.query = (options?: { client?: unknown }) => {
        calls.userQueryClient = options?.client
        return {
          where: () => ({
            forUpdate: () => ({ firstOrFail: async () => ({ id: 'user-2' }) }),
          }),
        }
      }
      // @ts-expect-error stubbing query builder for test
      PasswordResetToken.query = (options?: { client?: unknown }) => {
        calls.tokenQueryClient = options?.client
        return { where: () => ({ whereNull: () => ({ delete: async () => 1 }) }) }
      }
      // @ts-expect-error stubbing create for test
      PasswordResetToken.create = async (data: any, options?: { client?: unknown }) => {
        calls.createData = data
        calls.createClient = options?.client
        return { expiresAt: fakeExpiresAt }
      }

      const controller = new AuthController()
      let body: any = null
      await controller.forgotPassword({
        request: { validateUsing: async () => ({ email: 'a@example.com' }) },
        response: {
          ok: (payload: any) => {
            body = payload
            return payload
          },
          badRequest: (payload: any) => payload,
        },
      } as any)

      assert.deepEqual(calls.uids, ['email'])
      assert.equal(calls.value, 'a@example.com')
      assert.isTrue(calls.inTransaction)
      assert.strictEqual(calls.createClient, fakeTrx)
      assert.equal(body.data.expiresAt, fakeExpiresAt.toISO())
    } finally {
      User.findForAuth = origFindForAuth
      db.transaction = origTransaction
      User.query = origUserQuery
      PasswordResetToken.query = origTokenQuery
      PasswordResetToken.create = origCreate
    }
  })
})
