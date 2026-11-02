import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { NoteRecord } from '#database/active-records/index'
import { NoteStatus } from '#kernel/organisation/domain/types/index'
import {
  createAdmin,
  createContributor,
  createUser,
  loginAs,
  seedAcademicStructure,
  seedNote,
  seedNotePage,
} from '../support/helpers.js'

test.group('Notes / lifecycle', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('updates note metadata', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Old Title',
    })

    const response = await client
      .patch(`/api/v1/notes/${note.id}`)
      .bearerToken(token)
      .json({ title: 'New Title', description: 'Updated', price: 2500 })

    response.assertStatus(204)

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.title, 'New Title')
    assert.equal(stored.description, 'Updated')
    assert.equal(stored.price, 2500)
    assert.equal(stored.status, NoteStatus.DRAFT)
  })

  test('validates note updates and unknown notes', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()
    const note = await seedNote({ courseId: structure.course.id, uploadedBy: contributor.id })

    const invalid = await client
      .patch(`/api/v1/notes/${note.id}`)
      .bearerToken(token)
      .json({ title: 'A', price: -1 })
    invalid.assertStatus(422)
    assert.equal(invalid.body().error.code, 'VALIDATION_ERROR')

    const missing = await client
      .patch('/api/v1/notes/00000000-0000-4000-8000-000000000000')
      .bearerToken(token)
      .json({ title: 'Ghost' })
    missing.assertStatus(404)
    assert.equal(missing.body().error.code, 'NOTE_NOT_FOUND')
  })

  test('forbids students from updating notes', async ({ client }) => {
    const student = await createUser()
    const token = await loginAs(client, student)
    const contributor = await createContributor()
    const structure = await seedAcademicStructure()
    const note = await seedNote({ courseId: structure.course.id, uploadedBy: contributor.id })

    const response = await client
      .patch(`/api/v1/notes/${note.id}`)
      .bearerToken(token)
      .json({ title: 'Student Edit' })

    response.assertStatus(403)
  })

  test('publishes a note that is pending review', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const contributor = await createContributor()
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      status: NoteStatus.PENDING_REVIEW,
    })
    await seedNotePage(note.id, 0, contributor.id)

    const response = await client.post(`/api/v1/admin/notes/${note.id}/publish`).bearerToken(token)

    response.assertStatus(204)

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.status, NoteStatus.PUBLISHED)
    assert.isNotNull(stored.publishedAt)
  })

  test('rejects invalid publish transitions', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const contributor = await createContributor()
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      status: NoteStatus.DRAFT,
    })

    const response = await client.post(`/api/v1/admin/notes/${note.id}/publish`).bearerToken(token)

    response.assertStatus(409)
    assert.equal(response.body().error.code, 'NOTE_STATUS_TRANSITION_INVALID')
    assert.equal(response.body().error.message, 'Cannot publish note in status DRAFT')
  })

  test('rejects a note awaiting review', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const contributor = await createContributor()
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      status: NoteStatus.PENDING_REVIEW,
    })

    const response = await client.post(`/api/v1/admin/notes/${note.id}/reject`).bearerToken(token)

    response.assertStatus(204)

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.status, NoteStatus.REJECTED)
  })

  test('rejects invalid reject transitions', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const contributor = await createContributor()
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      status: NoteStatus.PUBLISHED,
    })

    const response = await client.post(`/api/v1/admin/notes/${note.id}/reject`).bearerToken(token)

    response.assertStatus(409)
    assert.equal(response.body().error.code, 'NOTE_STATUS_TRANSITION_INVALID')
    assert.equal(response.body().error.message, 'Cannot reject note in status PUBLISHED')
  })

  test('archives a note and records the timestamp', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const contributor = await createContributor()
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      status: NoteStatus.PUBLISHED,
    })

    const response = await client.post(`/api/v1/admin/notes/${note.id}/archive`).bearerToken(token)

    response.assertStatus(204)

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.status, NoteStatus.ARCHIVED)
    assert.isNotNull(stored.archivedAt)
  })

  test('returns 404 for lifecycle actions on unknown notes', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)

    for (const action of ['publish', 'reject', 'archive']) {
      const response = await client
        .post(`/api/v1/admin/notes/00000000-0000-4000-8000-000000000000/${action}`)
        .bearerToken(token)

      response.assertStatus(404)
      assert.equal(response.body().error.code, 'NOTE_NOT_FOUND')
    }
  })

  test('protects lifecycle actions', async ({ client }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      status: NoteStatus.PENDING_REVIEW,
    })

    const anonymous = await client.post(`/api/v1/admin/notes/${note.id}/publish`)
    anonymous.assertStatus(401)

    const forbidden = await client.post(`/api/v1/admin/notes/${note.id}/publish`).bearerToken(token)
    forbidden.assertStatus(403)
  })
})
