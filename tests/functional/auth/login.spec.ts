import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DEFAULT_PASSWORD, createUser } from '../support/helpers.js'

test.group('Auth / login', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('logs in with an email address', async ({ client, assert }) => {
    const user = await createUser({ fullName: 'Jane Doe' })

    const response = await client
      .post('/api/login')
      .json({ email: user.email, password: DEFAULT_PASSWORD })

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.user.id, user.id)
    assert.equal(data.user.email, user.email)
    assert.equal(data.user.fullName, 'Jane Doe')
    assert.match(data.accessToken, /^oat_/)
    assert.isString(data.refreshToken)
  })

  test('logs in with a phone number', async ({ client, assert }) => {
    const user = await createUser()

    const response = await client
      .post('/api/login')
      .json({ phoneNumber: user.phoneNumber, password: DEFAULT_PASSWORD })

    response.assertStatus(200)
    assert.equal(response.body().data.user.id, user.id)
  })

  test('rejects a wrong password', async ({ client, assert }) => {
    const user = await createUser()

    const response = await client
      .post('/api/login')
      .json({ email: user.email, password: 'WrongPassword1' })

    response.assertStatus(400)
    assert.equal(response.body().errors[0].message, 'Invalid user credentials')
  })

  test('rejects an unknown account', async ({ client, assert }) => {
    const response = await client
      .post('/api/login')
      .json({ email: 'nobody@example.com', password: DEFAULT_PASSWORD })

    response.assertStatus(400)
    assert.equal(response.body().errors[0].message, 'Invalid user credentials')
  })

  test('requires a password', async ({ client, assert }) => {
    const user = await createUser()

    const response = await client.post('/api/login').json({ email: user.email })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
  })

  test('requires an email or a phone number', async ({ client, assert }) => {
    const response = await client.post('/api/login').json({ password: DEFAULT_PASSWORD })

    response.assertStatus(400)
    assert.equal(response.body().message, 'email or phoneNumber is required')
  })

  test('issues a different session on every login', async ({ client, assert }) => {
    const user = await createUser()

    const first = await client
      .post('/api/login')
      .json({ email: user.email, password: DEFAULT_PASSWORD })
    const second = await client
      .post('/api/login')
      .json({ email: user.email, password: DEFAULT_PASSWORD })

    first.assertStatus(200)
    second.assertStatus(200)
    assert.notEqual(first.body().data.accessToken, second.body().data.accessToken)
    assert.notEqual(first.body().data.refreshToken, second.body().data.refreshToken)
  })
})
