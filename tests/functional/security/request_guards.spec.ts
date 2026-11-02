import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('HTTP request guards', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('rejects bodies containing prototype-pollution keys', async ({ client, assert }) => {
    /*
     * JSON parsing strips dangerous keys before the body guard runs, but
     * multipart field names are set verbatim on the parsed body, which is the
     * vector GHSA-f5x2 describes.
     */
    const response = await client
      .post('/api/login')
      .field('email', 'jane@example.com')
      .field('password', 'Password123')
      .field('constructor', 'polluted')

    response.assertStatus(400)
    assert.deepEqual(response.body(), {
      status: 'error',
      error: { code: 'MALFORMED_BODY', message: 'Invalid request body' },
    })
    assert.isUndefined(({} as Record<string, unknown>).polluted)
  })

  test('rejects bodies above the configured size ceiling', async ({ client, assert }) => {
    const oversized = {
      email: `${'a'.repeat(3 * 1024 * 1024)}@example.com`,
      password: 'Password123',
    }

    const response = await client.post('/api/login').json(oversized)

    response.assertStatus(413)
    assert.deepEqual(response.body(), {
      status: 'error',
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' },
    })
  })

  test('rejects malformed JSON bodies', async ({ client }) => {
    const response = await client
      .post('/api/login')
      .header('content-type', 'application/json')
      .unsafeJson('{"email":')

    response.assertStatus(400)
  })

  test('returns a JSON 404 for unknown routes', async ({ client }) => {
    const response = await client.get('/api/does-not-exist')

    response.assertStatus(404)
  })

  test('rejects malformed uuids before reaching the database', async ({ client, assert }) => {
    const response = await client.get('/api/v1/notes/not-a-uuid')

    response.assertStatus(422)
    assert.equal(response.body().status, 'error')
    assert.equal(response.body().error.code, 'INVALID_UUID_FORMAT_STRING')
    assert.equal(response.body().error.message, 'Invalid UUID: "not-a-uuid"')
  })
})
