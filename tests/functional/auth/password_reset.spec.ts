import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DEFAULT_PASSWORD, createAdmin, createUser, loginAs } from '../support/helpers.js'

const NEW_PASSWORD = 'BrandNewPassword1'

test.group('Auth / password reset', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('does not reveal whether an email is registered', async ({ client, assert }) => {
    const response = await client.post('/api/forgot-password').json({ email: 'nobody@example.com' })

    response.assertStatus(200)
    assert.equal(
      response.body().data.message,
      'If an account exists, a password reset token has been issued'
    )
    assert.notProperty(response.body().data, 'resetToken')
  })

  test('issues a reset token for a registered email', async ({ client, assert }) => {
    const user = await createUser()

    const response = await client.post('/api/forgot-password').json({ email: user.email })

    response.assertStatus(200)
    assert.isString(response.body().data.resetToken)
    assert.isString(response.body().data.expiresAt)
  })

  test('issues a reset token for a registered phone number', async ({ client, assert }) => {
    const user = await createUser()

    const response = await client
      .post('/api/forgot-password')
      .json({ phoneNumber: user.phoneNumber })

    response.assertStatus(200)
    assert.isString(response.body().data.resetToken)
  })

  test('validates the identifier', async ({ client, assert }) => {
    const response = await client.post('/api/forgot-password').json({ email: 'not-an-email' })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
  })

  test('resets the password with a valid token', async ({ client, assert }) => {
    const user = await createUser()
    const forgot = await client.post('/api/forgot-password').json({ email: user.email })
    forgot.assertStatus(200)

    const response = await client.post('/api/reset-password').json({
      token: forgot.body().data.resetToken,
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
    const forgot = await client.post('/api/forgot-password').json({ email: user.email })
    forgot.assertStatus(200)

    const first = await client.post('/api/reset-password').json({
      token: forgot.body().data.resetToken,
      password: NEW_PASSWORD,
    })
    first.assertStatus(200)

    const replay = await client.post('/api/reset-password').json({
      token: forgot.body().data.resetToken,
      password: 'AnotherPassword1',
    })
    replay.assertStatus(400)
    assert.equal(replay.body().message, 'Invalid or expired reset token')

    const unknown = await client.post('/api/reset-password').json({
      token: 'a'.repeat(64),
      password: NEW_PASSWORD,
    })
    unknown.assertStatus(400)
    assert.equal(unknown.body().message, 'Invalid or expired reset token')
  })

  test('rejects a weak new password', async ({ client, assert }) => {
    const user = await createUser()
    const forgot = await client.post('/api/forgot-password').json({ email: user.email })

    const response = await client.post('/api/reset-password').json({
      token: forgot.body().data.resetToken,
      password: 'weak',
    })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
  })

  test('revokes existing sessions when the password is reset', async ({ client }) => {
    const user = await createUser()
    const token = await loginAs(client, user)
    const forgot = await client.post('/api/forgot-password').json({ email: user.email })

    const reset = await client.post('/api/reset-password').json({
      token: forgot.body().data.resetToken,
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
