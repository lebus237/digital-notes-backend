import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import EmailVerificationToken from '#database/active-records/email_verification_token'
import User from '#database/active-records/user'
import {
  createUser,
  loginAs,
  seedEmailVerificationToken,
  truncateAll,
  uniqueEmail,
  uniquePhoneNumber,
} from '../support/helpers.js'

const VALID_TOKEN = 'c'.repeat(64)
const INVALID_TOKEN = 'd'.repeat(64)

test.group('Auth / email verification', (group) => {
  group.each.setup(() => truncateAll())

  test('verifies an email with a valid token', async ({ client, assert }) => {
    const user = await createUser()
    await seedEmailVerificationToken(user.id, VALID_TOKEN)

    const response = await client.post('/api/email/verify').json({ token: VALID_TOKEN })
    response.assertStatus(200)
    assert.equal(response.body().data.emailVerified, true)

    const stored = await User.findOrFail(user.id)
    assert.isNotNull(stored.emailVerifiedAt)

    const token = await client
      .post('/api/login')
      .json({ email: user.email, password: 'Password123' })
    token.assertStatus(200)
    assert.equal(token.body().data.user.emailVerified, true)
  })

  test('rejects unknown and expired tokens and treats a used token idempotently', async ({
    client,
    assert,
  }) => {
    const user = await createUser()

    const unknown = await client.post('/api/email/verify').json({ token: INVALID_TOKEN })
    unknown.assertStatus(400)

    await seedEmailVerificationToken(
      user.id,
      VALID_TOKEN,
      DateTime.utc().minus({ minute: 1 })
    )
    const expired = await client.post('/api/email/verify').json({ token: VALID_TOKEN })
    expired.assertStatus(400)

    await EmailVerificationToken.query().where('userId', user.id).delete()
    await seedEmailVerificationToken(user.id, VALID_TOKEN)
    const first = await client.post('/api/email/verify').json({ token: VALID_TOKEN })
    first.assertStatus(200)

    const replay = await client.post('/api/email/verify').json({ token: VALID_TOKEN })
    replay.assertStatus(200)
    assert.equal(replay.body().data.emailVerified, true)
  })

  test('creates a verification token when registering a student', async ({ client, assert }) => {
    const email = uniqueEmail('verify')
    const response = await client.post('/api/register').json({
      fullName: 'Verification Student',
      email,
      phoneNumber: uniquePhoneNumber(),
      password: 'Password123',
    })

    response.assertStatus(201)
    assert.equal(response.body().data.user.emailVerified, false)

    const user = await User.findByOrFail('email', email)
    const token = await EmailVerificationToken.query().where('userId', user.id).first()
    assert.isNotNull(token)
  })

  test('lets an authenticated student resend the verification email', async ({ client, assert }) => {
    const user = await createUser()
    const accessToken = await loginAs(client, user)

    const response = await client
      .post('/api/email/resend')
      .bearerToken(accessToken)

    response.assertStatus(200)
    assert.equal(response.body().data.emailVerified, false)

    const token = await EmailVerificationToken.query().where('userId', user.id).first()
    assert.isNotNull(token)

    await seedEmailVerificationToken(user.id, VALID_TOKEN)
    const verify = await client.post('/api/email/verify').json({ token: VALID_TOKEN })
    verify.assertStatus(200)

    const alreadyVerified = await client
      .post('/api/email/resend')
      .bearerToken(accessToken)
    alreadyVerified.assertStatus(200)
    assert.equal(alreadyVerified.body().data.emailVerified, true)
  })

  test('requires authentication to resend a verification email', async ({ client }) => {
    const response = await client.post('/api/email/resend')
    response.assertStatus(401)
  })
})
