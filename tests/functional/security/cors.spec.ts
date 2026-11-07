import { test } from '@japa/runner'

const ALLOWED_ORIGIN = 'http://localhost:3001'
const STUDENT_APP_ORIGIN = 'http://localhost:3003'
const BLOCKED_ORIGIN = 'http://evil.example.com'

test.group('HTTP / CORS', () => {
  test('returns the allowed origin for a configured caller', async ({ client, assert }) => {
    const response = await client
      .get('/api/v1/universities')
      .header('origin', ALLOWED_ORIGIN)

    response.assertStatus(200)
    assert.equal(response.header('access-control-allow-origin'), ALLOWED_ORIGIN)
  })

  test('allows the locally hosted student app', async ({ client, assert }) => {
    const response = await client
      .options('/api/v1/admin/courses/00000000-0000-4000-8000-000000000000')
      .header('origin', STUDENT_APP_ORIGIN)
      .header('access-control-request-method', 'PATCH')
      .header('access-control-request-headers', 'authorization,content-type')

    response.assertStatus(204)
    assert.equal(response.header('access-control-allow-origin'), STUDENT_APP_ORIGIN)
  })

  test('does not return an origin for an unlisted caller', async ({ client, assert }) => {
    const response = await client
      .get('/api/v1/universities')
      .header('origin', BLOCKED_ORIGIN)

    response.assertStatus(200)
    assert.isUndefined(response.header('access-control-allow-origin'))
  })

  test('allows a PATCH preflight for a configured caller', async ({ client, assert }) => {
    const response = await client
      .options('/api/v1/admin/courses/00000000-0000-4000-8000-000000000000')
      .header('origin', ALLOWED_ORIGIN)
      .header('access-control-request-method', 'PATCH')
      .header('access-control-request-headers', 'authorization,content-type')

    response.assertStatus(204)
    assert.equal(response.header('access-control-allow-origin'), ALLOWED_ORIGIN)
    assert.include(response.header('access-control-allow-methods') ?? '', 'PATCH')
  })

  test('rejects a PATCH preflight from an unlisted origin', async ({ client, assert }) => {
    const response = await client
      .options('/api/v1/admin/courses/00000000-0000-4000-8000-000000000000')
      .header('origin', BLOCKED_ORIGIN)
      .header('access-control-request-method', 'PATCH')

    response.assertStatus(204)
    assert.isUndefined(response.header('access-control-allow-origin'))
  })

  test('leaves same-origin and non-browser requests untouched', async ({ client, assert }) => {
    const response = await client.get('/api/v1/universities')

    response.assertStatus(200)
    assert.isUndefined(response.header('access-control-allow-origin'))
  })
})
