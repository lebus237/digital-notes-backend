import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser, loginAs } from '../support/helpers.js'

test.group('Auth / session', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns the authenticated profile from /api/me', async ({ client, assert }) => {
    const user = await createUser({ fullName: 'Ada Lovelace' })
    const token = await loginAs(client, user)

    const response = await client.get('/api/me').bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().data.user.id, user.id)
    assert.equal(response.body().data.user.email, user.email)
    assert.equal(response.body().data.user.fullName, 'Ada Lovelace')
  })

  test('rejects /api/me without a token', async ({ client }) => {
    const response = await client.get('/api/me')

    response.assertStatus(401)
  })

  test('rejects /api/me with an unknown token', async ({ client }) => {
    const response = await client.get('/api/me').bearerToken('oat_not-a-real-token')

    response.assertStatus(401)
  })

  test('rotates a refresh token into a new session', async ({ client, assert }) => {
    const user = await createUser()
    const login = await client
      .post('/api/login')
      .json({ email: user.email, password: 'Password123' })
    login.assertStatus(200)

    const response = await client
      .post('/api/refresh')
      .json({ refreshToken: login.body().data.refreshToken })

    response.assertStatus(200)
    const rotated = response.body().data
    assert.notEqual(rotated.refreshToken, login.body().data.refreshToken)
    assert.match(rotated.accessToken, /^oat_/)

    const me = await client.get('/api/me').bearerToken(rotated.accessToken)
    me.assertStatus(200)
    assert.equal(me.body().data.user.id, user.id)
  })

  test('rejects a refresh token that was already used', async ({ client, assert }) => {
    const user = await createUser()
    const login = await client
      .post('/api/login')
      .json({ email: user.email, password: 'Password123' })
    login.assertStatus(200)
    const refreshToken = login.body().data.refreshToken

    const first = await client.post('/api/refresh').json({ refreshToken })
    first.assertStatus(200)

    const replay = await client.post('/api/refresh').json({ refreshToken })

    replay.assertStatus(401)
    assert.equal(replay.body().message, 'Invalid or expired refresh token')
  })

  test('rejects an unknown refresh token', async ({ client, assert }) => {
    const response = await client.post('/api/refresh').json({ refreshToken: 'a'.repeat(64) })

    response.assertStatus(401)
    assert.equal(response.body().message, 'Invalid or expired refresh token')
  })

  test('validates the refresh token payload', async ({ client, assert }) => {
    const response = await client.post('/api/refresh').json({ refreshToken: 'short' })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
  })

  test('logout requires authentication', async ({ client }) => {
    const response = await client.post('/api/logout')

    response.assertStatus(401)
  })

  test('logout revokes the access token', async ({ client }) => {
    const user = await createUser()
    const token = await loginAs(client, user)

    const response = await client.post('/api/logout').bearerToken(token)
    response.assertStatus(204)

    const me = await client.get('/api/me').bearerToken(token)
    me.assertStatus(401)
  })

  test('logout revokes the supplied refresh token', async ({ client, assert }) => {
    const user = await createUser()
    const login = await client
      .post('/api/login')
      .json({ email: user.email, password: 'Password123' })
    login.assertStatus(200)

    const logout = await client
      .post('/api/logout')
      .bearerToken(login.body().data.accessToken)
      .json({ refreshToken: login.body().data.refreshToken })
    logout.assertStatus(204)

    const refresh = await client
      .post('/api/refresh')
      .json({ refreshToken: login.body().data.refreshToken })
    refresh.assertStatus(401)
    assert.equal(refresh.body().message, 'Invalid or expired refresh token')
  })
})
