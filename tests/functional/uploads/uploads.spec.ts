import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UploadRecord } from '#database/active-records/index'
import { ONE_PIXEL_PNG, createAdmin, createUser, loginAs } from '../support/helpers.js'
import { testStorage } from '../../bootstrap.js'

test.group('Uploads', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('requires authentication', async ({ client }) => {
    const response = await client
      .post('/api/uploads')
      .file('file', ONE_PIXEL_PNG, { filename: 'page.png', contentType: 'image/png' })

    response.assertStatus(401)
  })

  test('requires a file field', async ({ client, assert }) => {
    const user = await createUser()
    const token = await loginAs(client, user)

    const response = await client
      .post('/api/uploads')
      .bearerToken(token)
      .field('title', 'Missing file')

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
    assert.include(JSON.stringify(response.body().error.details), 'file')
  })

  test('rejects file extensions outside the allowlist', async ({ client, assert }) => {
    const user = await createUser()
    const token = await loginAs(client, user)

    const response = await client
      .post('/api/uploads')
      .bearerToken(token)
      .file('file', Buffer.from('PK'), { filename: 'archive.zip', contentType: 'application/zip' })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
  })

  test('stores an image and records its owner', async ({ client, assert }) => {
    const user = await createUser()
    const token = await loginAs(client, user)

    const response = await client
      .post('/api/uploads')
      .bearerToken(token)
      .field('title', 'Lecture slide')
      .field('description', 'Week one')
      .file('file', ONE_PIXEL_PNG, { filename: 'slide.png', contentType: 'image/png' })

    response.assertStatus(201)
    const body = response.body()
    assert.isString(body.id)
    assert.equal(body.type, 'image')
    assert.match(body.url, /^https:\/\/storage\.test\//)

    const stored = await UploadRecord.findOrFail(body.id)
    assert.equal(stored.type, 'image')
    assert.equal(stored.title, 'Lecture slide')
    assert.equal(stored.description, 'Week one')
    assert.equal(stored.mimeType, 'image/png')
    assert.equal(stored.createdBy, user.id)
    assert.isTrue(await testStorage.exists(stored.relativeKey))
  })

  test('classifies non-image files as documents', async ({ client, assert }) => {
    const user = await createUser()
    const token = await loginAs(client, user)

    const response = await client
      .post('/api/uploads')
      .bearerToken(token)
      .file('file', Buffer.from('hello notes'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })

    response.assertStatus(201)
    assert.equal(response.body().type, 'document')

    const stored = await UploadRecord.findOrFail(response.body().id)
    assert.equal(stored.type, 'document')
    assert.equal(stored.mimeType, 'text/plain')
  })

  test('lets the owner delete an upload', async ({ client, assert }) => {
    const user = await createUser()
    const token = await loginAs(client, user)
    const upload = await client
      .post('/api/uploads')
      .bearerToken(token)
      .file('file', ONE_PIXEL_PNG, { filename: 'page.png', contentType: 'image/png' })
    upload.assertStatus(201)

    const stored = await UploadRecord.findOrFail(upload.body().id)
    const key = stored.relativeKey

    const response = await client.delete(`/api/uploads/${upload.body().id}`).bearerToken(token)

    response.assertStatus(204)
    assert.isNull(await UploadRecord.find(upload.body().id))
    assert.isFalse(await testStorage.exists(key))
  })

  test("hides another user's upload behind a 404", async ({ client, assert }) => {
    const owner = await createUser()
    const ownerToken = await loginAs(client, owner)
    const other = await createUser()
    const otherToken = await loginAs(client, other)

    const upload = await client
      .post('/api/uploads')
      .bearerToken(ownerToken)
      .file('file', ONE_PIXEL_PNG, { filename: 'page.png', contentType: 'image/png' })
    upload.assertStatus(201)

    const response = await client.delete(`/api/uploads/${upload.body().id}`).bearerToken(otherToken)

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'MEDIA_NOT_FOUND')
    assert.isNotNull(await UploadRecord.find(upload.body().id))
  })

  test('lets an administrator delete another user upload', async ({ client, assert }) => {
    const owner = await createUser()
    const ownerToken = await loginAs(client, owner)
    const admin = await createAdmin()
    const adminToken = await loginAs(client, admin)

    const upload = await client
      .post('/api/uploads')
      .bearerToken(ownerToken)
      .file('file', ONE_PIXEL_PNG, { filename: 'page.png', contentType: 'image/png' })
    upload.assertStatus(201)

    const response = await client.delete(`/api/uploads/${upload.body().id}`).bearerToken(adminToken)

    response.assertStatus(204)
    assert.isNull(await UploadRecord.find(upload.body().id))
  })

  test('returns 404 for an unknown upload and 422 for a malformed id', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const token = await loginAs(client, user)

    const missing = await client
      .delete('/api/uploads/00000000-0000-4000-8000-000000000000')
      .bearerToken(token)
    missing.assertStatus(404)
    assert.equal(missing.body().error.code, 'MEDIA_NOT_FOUND')

    const malformed = await client.delete('/api/uploads/not-a-uuid').bearerToken(token)
    malformed.assertStatus(422)
    assert.equal(malformed.body().error.code, 'INVALID_UUID_FORMAT_STRING')
  })
})
