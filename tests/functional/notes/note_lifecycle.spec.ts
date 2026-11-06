import { test } from '@japa/runner'
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
  truncateAll,
} from '../support/helpers.js'

test.group('Notes / lifecycle', (group) => {
  group.each.setup(truncateAll)

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

  test('hides another contributor note behind a 404', async ({ client, assert }) => {
    const owner = await createContributor()
    const other = await createContributor()
    const token = await loginAs(client, other)
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: owner.id,
      title: 'Owner Title',
    })

    const response = await client
      .patch(`/api/v1/notes/${note.id}`)
      .bearerToken(token)
      .json({ title: 'Hijacked Title', price: 1 })

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'NOTE_NOT_FOUND')

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.title, 'Owner Title')
    assert.equal(stored.price, 0)
  })

  test('lets an administrator update a contributor note', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const contributor = await createContributor()
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Contributor Title',
    })

    const response = await client
      .patch(`/api/v1/admin/notes/${note.id}`)
      .bearerToken(token)
      .json({ title: 'Admin Edited' })

    response.assertStatus(204)

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.title, 'Admin Edited')
  })

  test('submits a draft note for review', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Draft To Submit',
      status: NoteStatus.DRAFT,
    })

    const response = await client
      .post(`/api/v1/notes/${note.id}/submit`)
      .bearerToken(token)

    response.assertStatus(204)

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.status, NoteStatus.PENDING_REVIEW)
  })

  test('allows a rejected note to be resubmitted', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Rejected Note',
      status: NoteStatus.REJECTED,
    })

    const response = await client
      .post(`/api/v1/notes/${note.id}/submit`)
      .bearerToken(token)

    response.assertStatus(204)

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.status, NoteStatus.PENDING_REVIEW)
  })

  test('rejects submit transitions from published or already pending notes', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const contributor = await createContributor()
    const structure = await seedAcademicStructure()

    for (const status of [NoteStatus.PENDING_REVIEW, NoteStatus.PUBLISHED]) {
      const note = await seedNote({
        courseId: structure.course.id,
        uploadedBy: contributor.id,
        title: `Cannot Submit ${status}`,
        status,
      })

      const response = await client
        .post(`/api/v1/notes/${note.id}/submit`)
        .bearerToken(token)

      response.assertStatus(409)
      assert.equal(response.body().error.code, 'NOTE_STATUS_TRANSITION_INVALID')
    }
  })

  test('hides another contributor note when submitting', async ({ client, assert }) => {
    const owner = await createContributor()
    const other = await createContributor()
    const token = await loginAs(client, other)
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: owner.id,
      title: 'Owner Draft',
      status: NoteStatus.DRAFT,
    })

    const response = await client
      .post(`/api/v1/notes/${note.id}/submit`)
      .bearerToken(token)

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'NOTE_NOT_FOUND')

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.status, NoteStatus.DRAFT)
  })

  test('lets an administrator submit a contributor note', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const contributor = await createContributor()
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Admin Submitted',
      status: NoteStatus.DRAFT,
    })

    const response = await client
      .post(`/api/v1/notes/${note.id}/submit`)
      .bearerToken(token)

    response.assertStatus(204)

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.status, NoteStatus.PENDING_REVIEW)
  })

  test('submits a note and lets an administrator publish it', async ({ client, assert }) => {
    const contributor = await createContributor()
    const contributorToken = await loginAs(client, contributor)
    const admin = await createAdmin()
    const adminToken = await loginAs(client, admin)
    const structure = await seedAcademicStructure()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Lifecycle Note',
      status: NoteStatus.DRAFT,
    })

    const submit = await client
      .post(`/api/v1/notes/${note.id}/submit`)
      .bearerToken(contributorToken)
    submit.assertStatus(204)

    const publish = await client
      .post(`/api/v1/admin/notes/${note.id}/publish`)
      .bearerToken(adminToken)
    publish.assertStatus(204)

    const stored = await NoteRecord.findOrFail(note.id)
    assert.equal(stored.status, NoteStatus.PUBLISHED)
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
