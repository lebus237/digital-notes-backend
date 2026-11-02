import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DEFAULT_PASSWORD, createUser, loginAs } from '../support/helpers.js'

const NEW_PASSWORD = 'AnotherPassword1'

test.group('Auth / change password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('requires authentication', async ({ client }) => {
    const response = await client.post('/api/change-password').json({
      currentPassword: DEFAULT_PASSWORD,
      newPassword: NEW_PASSWORD,
    })

    response.assertStatus(401)
  })

  test('validates the payload', async ({ client, assert }) => {
    const user = await createUser()
    const token = await loginAs(client, user)

    const response = await client
      .post('/api/change-password')
      .bearerToken(token)
      .json({ currentPassword: DEFAULT_PASSWORD, newPassword: 'weak' })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
  })

  test('rejects a wrong current password', async ({ client, assert }) => {
    const user = await createUser()
    const token = await loginAs(client, user)

    const response = await client
      .post('/api/change-password')
      .bearerToken(token)
      .json({ currentPassword: 'WrongPassword1', newPassword: NEW_PASSWORD })

    response.assertStatus(401)
    assert.equal(response.body().message, 'Current password is incorrect')
  })

  test('changes the password and revokes existing sessions', async ({ client }) => {
    const user = await createUser()
    const token = await loginAs(client, user)

    const response = await client
      .post('/api/change-password')
      .bearerToken(token)
      .json({ currentPassword: DEFAULT_PASSWORD, newPassword: NEW_PASSWORD })

    response.assertStatus(204)

    const oldLogin = await client
      .post('/api/login')
      .json({ email: user.email, password: DEFAULT_PASSWORD })
    oldLogin.assertStatus(400)

    const newLogin = await client
      .post('/api/login')
      .json({ email: user.email, password: NEW_PASSWORD })
    newLogin.assertStatus(200)

    const me = await client.get('/api/me').bearerToken(token)
    me.assertStatus(401)
  })
})
