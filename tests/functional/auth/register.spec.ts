import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#database/active-records/user'
import { UserRole } from '#kernel/user/domain/types/user_role'
import { DEFAULT_PASSWORD, uniqueEmail, uniquePhoneNumber } from '../support/helpers.js'

test.group('Auth / register', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  function payload() {
    return {
      fullName: 'Jane Doe',
      email: uniqueEmail('jane'),
      phoneNumber: uniquePhoneNumber(),
      password: DEFAULT_PASSWORD,
    }
  }

  test('creates a student account and issues an access and refresh token', async ({
    client,
    assert,
  }) => {
    const body = payload()

    const response = await client.post('/api/register').json(body)

    response.assertStatus(201)
    const data = response.body().data
    assert.equal(data.user.email, body.email)
    assert.equal(data.user.fullName, body.fullName)
    assert.equal(data.user.phoneNumber, body.phoneNumber)
    assert.equal(data.user.role, UserRole.STUDENT)
    assert.match(data.accessToken, /^oat_/)
    assert.isString(data.refreshToken)
    assert.isAbove(data.refreshToken.length, 32)

    const user = await User.findByOrFail('email', body.email)
    assert.equal(user.role, UserRole.STUDENT)
  })

  test('never exposes the password hash in the response', async ({ client, assert }) => {
    const body = payload()

    const response = await client.post('/api/register').json(body)

    response.assertStatus(201)
    assert.notInclude(JSON.stringify(response.body()), body.password)
    assert.notProperty(response.body().data.user, 'password')
    assert.notProperty(response.body().data.user, 'passwordHash')
  })

  test('ignores a role supplied by the client', async ({ client, assert }) => {
    const body = { ...payload(), role: UserRole.ADMINISTRATOR }

    const response = await client.post('/api/register').json(body)

    response.assertStatus(201)
    assert.equal(response.body().data.user.role, UserRole.STUDENT)

    const user = await User.findByOrFail('email', body.email)
    assert.equal(user.role, UserRole.STUDENT)
  })

  test('normalizes the email to lowercase', async ({ client, assert }) => {
    const body = { ...payload(), email: uniqueEmail('UPPER').toUpperCase() }

    const response = await client.post('/api/register').json(body)

    response.assertStatus(201)
    assert.equal(response.body().data.user.email, body.email.toLowerCase())
    assert.isNotNull(await User.findBy('email', body.email.toLowerCase()))
  })

  test('rejects a duplicate email with a conflict', async ({ client, assert }) => {
    const body = payload()
    const first = await client.post('/api/register').json(body)
    first.assertStatus(201)

    const response = await client
      .post('/api/register')
      .json({ ...body, phoneNumber: uniquePhoneNumber() })

    response.assertStatus(409)
    assert.equal(
      response.body().message,
      'An account with this email or phone number already exists'
    )
  })

  test('rejects a duplicate phone number with a conflict', async ({ client, assert }) => {
    const body = payload()
    const first = await client.post('/api/register').json(body)
    first.assertStatus(201)

    const response = await client.post('/api/register').json({ ...body, email: uniqueEmail() })

    response.assertStatus(409)
    assert.equal(
      response.body().message,
      'An account with this email or phone number already exists'
    )
  })

  const invalidPayloads = [
    { title: 'a missing email', body: { email: undefined }, field: 'email' },
    { title: 'a malformed email', body: { email: 'not-an-email' }, field: 'email' },
    { title: 'a missing password', body: { password: undefined }, field: 'password' },
    { title: 'a short password', body: { password: 'Ab1' }, field: 'password' },
    {
      title: 'a password without an uppercase letter',
      body: { password: 'password123' },
      field: 'password',
    },
    { title: 'a password without a digit', body: { password: 'PasswordOnly' }, field: 'password' },
    { title: 'a missing full name', body: { fullName: undefined }, field: 'fullName' },
    { title: 'a missing phone number', body: { phoneNumber: undefined }, field: 'phoneNumber' },
    {
      title: 'a phone number longer than 12 characters',
      body: { phoneNumber: '071234567890123' },
      field: 'phoneNumber',
    },
  ]

  for (const scenario of invalidPayloads) {
    test(`rejects ${scenario.title}`, async ({ client, assert }) => {
      const body = { ...payload(), ...scenario.body }

      const response = await client.post('/api/register').json(body)

      response.assertStatus(422)
      const error = response.body().error
      assert.equal(response.body().status, 'error')
      assert.equal(error.code, 'VALIDATION_ERROR')
      assert.equal(error.message, 'Validation failed')
      assert.isArray(error.details)
      assert.include(JSON.stringify(error.details), scenario.field)
    })
  }
})
