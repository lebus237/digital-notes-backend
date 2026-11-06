import { test } from '@japa/runner'
import PasswordResetToken from '#database/active-records/password_reset_token'
import {
  DEFAULT_PASSWORD,
  createAdmin,
  createUser,
  loginAs,
  seedPasswordResetToken,
  truncateAll,
} from '../support/helpers.js'

const NEW_PASSWORD = 'BrandNewPassword1'
const VALID_RESET_TOKEN = 'a'.repeat(64)
const UNKNOWN_RESET_TOKEN = 'b'.repeat(64)

test.group('Auth / password reset', (group) => {
  group.each.setup(() => truncateAll())

  test('does not reveal whether an email is registered', async ({ client, assert }) => {
    const response = await client.post('/api/forgot-password').json({ email: 'nobody@example.com' })

    response.assertStatus(200)
    assert.equal(
      response.body().data.message,
      'If an account exists, a password reset token has been issued'
    )
    assert.notProperty(response.body().data, 'resetToken')
    assert.notProperty(response.body().data, 'expiresAt')
  })

  test('never returns the reset token for a registered email', async ({ client, assert }) => {
    const user = await createUser()

    const response = await client.post('/api/forgot-password').json({ email: user.email })

    response.assertStatus(200)
    assert.notProperty(response.body().data, 'resetToken')
    assert.notProperty(response.body().data, 'token')
    assert.notProperty(response.body().data, 'expiresAt')
    assert.notInclude(JSON.stringify(response.body()), 'resetToken')

    const stored = await PasswordResetToken.query().where('userId', user.id).first()
    assert.isNotNull(stored)
  })

  test('never returns the reset token for a registered phone number', async ({ client, assert }) => {
    const user = await createUser()

    const response = await client
      .post('/api/forgot-password')
      .json({ phoneNumber: user.phoneNumber })

    response.assertStatus(200)
    assert.notProperty(response.body().data, 'resetToken')
    assert.notProperty(response.body().data, 'expiresAt')

    const stored = await PasswordResetToken.query().where('userId', user.id).first()
    assert.isNotNull(stored)
  })

  test('validates the identifier', async ({ client, assert }) => {
    const response = await client.post('/api/forgot-password').json({ email: 'not-an-email' })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
  })

  test('resets the password with a valid token', async ({ client, assert }) => {
    const user = await createUser()
    await seedPasswordResetToken(user.id, VALID_RESET_TOKEN)

    const response = await client.post('/api/reset-password').json({
      token: VALID_RESET_TOKEN,
      password: NEW_PASSWORD,
    })

    response.assertStatus(200)
    assert.equal(response.body().data.message, 'Password has been reset')

    const oldLogin = await client
      .post('/api/login')
      .json({ email: user.email, password: DEFAULT_PASSWORD })
    oldLogin.assertStatus(400)

    const newLogin = await client
      .post('/api/login')
      .json({ email: user.email, password: NEW_PASSWORD })
    newLogin.assertStatus(200)
  })

  test('rejects unknown and already used reset tokens', async ({ client, assert }) => {
    const user = await createUser()
    await seedPasswordResetToken(user.id, VALID_RESET_TOKEN)

    const first = await client.post('/api/reset-password').json({
      token: VALID_RESET_TOKEN,
      password: NEW_PASSWORD,
    })
    first.assertStatus(200)

    const replay = await client.post('/api/reset-password').json({
      token: VALID_RESET_TOKEN,
      password: 'AnotherPassword1',
    })
    replay.assertStatus(400)
    assert.equal(replay.body().message, 'Invalid or expired reset token')

    const unknown = await client.post('/api/reset-password').json({
      token: UNKNOWN_RESET_TOKEN,
      password: NEW_PASSWORD,
    })
    unknown.assertStatus(400)
    assert.equal(unknown.body().message, 'Invalid or expired reset token')
  })

  test('rejects a weak new password', async ({ client, assert }) => {
    const user = await createUser()
    await seedPasswordResetToken(user.id, VALID_RESET_TOKEN)

    const response = await client.post('/api/reset-password').json({
      token: VALID_RESET_TOKEN,
      password: 'weak',
    })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
  })

  test('revokes existing sessions when the password is reset', async ({ client }) => {
    const user = await createUser()
    const token = await loginAs(client, user)
    await seedPasswordResetToken(user.id, VALID_RESET_TOKEN)

    const reset = await client.post('/api/reset-password').json({
      token: VALID_RESET_TOKEN,
      password: NEW_PASSWORD,
    })
    reset.assertStatus(200)

    const me = await client.get('/api/me').bearerToken(token)
    me.assertStatus(401)
  })

  test('lets an administrator issue a temporary password', async ({ client, assert }) => {
    const admin = await createAdmin()
    const adminToken = await loginAs(client, admin)
    const user = await createUser()

    const response = await client
      .post(`/api/v1/admin/users/${user.id}/reset-password`)
      .bearerToken(adminToken)

    response.assertStatus(201)
    const temporaryPassword = response.body().data.temporaryPassword as string
    assert.isString(temporaryPassword)

    const login = await client
      .post('/api/login')
      .json({ email: user.email, password: temporaryPassword })
    login.assertStatus(200)
    assert.equal(login.body().data.user.id, user.id)
  })

  test('forbids non-administrators from resetting another password', async ({ client }) => {
    const actor = await createUser()
    const actorToken = await loginAs(client, actor)
    const target = await createUser()

    const response = await client
      .post(`/api/v1/admin/users/${target.id}/reset-password`)
      .bearerToken(actorToken)

    response.assertStatus(403)
  })

  test('requires authentication to reset another password', async ({ client }) => {
    const target = await createUser()

    const response = await client.post(`/api/v1/admin/users/${target.id}/reset-password`)

    response.assertStatus(401)
  })

  test('returns 404 for an unknown user and 422 for a malformed id', async ({ client, assert }) => {
    const admin = await createAdmin()
    const adminToken = await loginAs(client, admin)

    const missing = await client
      .post('/api/v1/admin/users/00000000-0000-4000-8000-000000000000/reset-password')
      .bearerToken(adminToken)
    missing.assertStatus(404)
    assert.equal(missing.body().message, 'User not found')

    const malformed = await client
      .post('/api/v1/admin/users/not-a-uuid/reset-password')
      .bearerToken(adminToken)
    malformed.assertStatus(422)
    assert.equal(malformed.body().error.code, 'INVALID_UUID_FORMAT_STRING')
  })
})
