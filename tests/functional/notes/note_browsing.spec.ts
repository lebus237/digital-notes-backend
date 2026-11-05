import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { NoteStatus, NoteType } from '#kernel/organisation/domain/types/index'
import {
  createAdmin,
  createContributor,
  loginAs,
  seedAcademicStructure,
  seedNote,
  seedNotePage,
} from '../support/helpers.js'

test.group('Notes / browsing', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('lists notes for a course without authentication', async ({ client, assert }) => {
    const structure = await seedAcademicStructure()
    const contributor = await createContributor()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Published Lecture Notes',
      status: NoteStatus.PUBLISHED,
    })
    await seedNotePage(note.id, 0, contributor.id)
    await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Draft Notes',
    })

    const response = await client.get(`/api/v1/courses/${structure.course.id}/notes`)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().meta.total, 1)
    assert.equal(response.body().data[0].id, note.id)
    assert.equal(response.body().data[0].status, NoteStatus.PUBLISHED)
    assert.notInclude(
      response.body().data.map((item: any) => item.status),
      NoteStatus.DRAFT
    )

    const published = response.body().data.find((item: any) => item.id === note.id)
    assert.equal(published.pageCount, 1)
  })

  test('hides non-published notes from the public catalogue and detail', async ({
    client,
    assert,
  }) => {
    const structure = await seedAcademicStructure()
    const contributor = await createContributor()

    const hiddenStatuses = [
      NoteStatus.DRAFT,
      NoteStatus.PENDING_REVIEW,
      NoteStatus.REJECTED,
      NoteStatus.ARCHIVED,
    ]

    const hiddenNotes = []
    for (const status of hiddenStatuses) {
      hiddenNotes.push(
        await seedNote({
          courseId: structure.course.id,
          uploadedBy: contributor.id,
          title: `Hidden ${status}`,
          status,
        })
      )
    }

    const list = await client.get(`/api/v1/courses/${structure.course.id}/notes`)
    list.assertStatus(200)
    assert.lengthOf(list.body().data, 0)
    assert.equal(list.body().meta.total, 0)

    for (const note of hiddenNotes) {
      const detail = await client.get(`/api/v1/notes/${note.id}`)
      detail.assertStatus(404)
      assert.equal(detail.body().error.code, 'NOTE_NOT_FOUND')
    }
  })

  test('lets an administrator read unpublished notes', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()
    const contributor = await createContributor()
    const draft = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Admin Only Draft',
      status: NoteStatus.DRAFT,
    })

    const list = await client
      .get(`/api/v1/admin/courses/${structure.course.id}/notes`)
      .bearerToken(token)
    list.assertStatus(200)
    assert.lengthOf(list.body().data, 1)
    assert.equal(list.body().data[0].status, NoteStatus.DRAFT)

    const detail = await client.get(`/api/v1/admin/notes/${draft.id}`).bearerToken(token)
    detail.assertStatus(200)
    assert.equal(detail.body().id, draft.id)
    assert.equal(detail.body().status, NoteStatus.DRAFT)
  })

  test('protects admin note reads', async ({ client }) => {
    const structure = await seedAcademicStructure()
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)

    const anonymous = await client.get(
      `/api/v1/admin/courses/${structure.course.id}/notes`
    )
    anonymous.assertStatus(401)

    const forbidden = await client
      .get(`/api/v1/admin/courses/${structure.course.id}/notes`)
      .bearerToken(token)
    forbidden.assertStatus(403)
  })

  test('filters notes by status, type and search term', async ({ client, assert }) => {
    const structure = await seedAcademicStructure()
    const contributor = await createContributor()

    await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Revision Sheet',
      status: NoteStatus.PUBLISHED,
      noteType: NoteType.REVISION,
    })
    await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Past Paper 2024',
      status: NoteStatus.PUBLISHED,
      noteType: NoteType.PAST_EXAM,
    })
    await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Draft Summary',
      status: NoteStatus.DRAFT,
      noteType: NoteType.SUMMARY,
    })

    const byStatus = await client
      .get(`/api/v1/courses/${structure.course.id}/notes`)
      .qs({ status: NoteStatus.PUBLISHED })
    byStatus.assertStatus(200)
    assert.lengthOf(byStatus.body().data, 2)

    const byType = await client
      .get(`/api/v1/courses/${structure.course.id}/notes`)
      .qs({ noteType: NoteType.PAST_EXAM })
    byType.assertStatus(200)
    assert.lengthOf(byType.body().data, 1)
    assert.equal(byType.body().data[0].title, 'Past Paper 2024')

    const bySearch = await client
      .get(`/api/v1/courses/${structure.course.id}/notes`)
      .qs({ q: 'revision' })
    bySearch.assertStatus(200)
    assert.lengthOf(bySearch.body().data, 1)
    assert.equal(bySearch.body().data[0].title, 'Revision Sheet')
  })

  test('rejects unknown status and note type filters', async ({ client, assert }) => {
    const structure = await seedAcademicStructure()

    const status = await client
      .get(`/api/v1/courses/${structure.course.id}/notes`)
      .qs({ status: 'SOMETHING_ELSE' })
    status.assertStatus(422)
    assert.equal(status.body().error.code, 'INVALID_STATUS')

    const noteType = await client
      .get(`/api/v1/courses/${structure.course.id}/notes`)
      .qs({ noteType: 'FLASHCARDS' })
    noteType.assertStatus(422)
    assert.equal(noteType.body().error.code, 'INVALID_NOTE_TYPE')
  })

  test('only lists notes belonging to the requested course', async ({ client, assert }) => {
    const first = await seedAcademicStructure()
    const second = await seedAcademicStructure()
    const contributor = await createContributor()

    await seedNote({
      courseId: first.course.id,
      uploadedBy: contributor.id,
      title: 'First',
      status: NoteStatus.PUBLISHED,
    })
    await seedNote({
      courseId: second.course.id,
      uploadedBy: contributor.id,
      title: 'Second',
      status: NoteStatus.PUBLISHED,
    })

    const response = await client.get(`/api/v1/courses/${first.course.id}/notes`)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].title, 'First')
  })

  test('shows a note with its ordered pages', async ({ client, assert }) => {
    const structure = await seedAcademicStructure()
    const contributor = await createContributor()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Illustrated Notes',
      status: NoteStatus.PUBLISHED,
      noteType: NoteType.SUMMARY,
      price: 1500,
    })
    const firstPage = await seedNotePage(note.id, 1, contributor.id)
    await seedNotePage(note.id, 0, contributor.id)

    const response = await client.get(`/api/v1/notes/${note.id}`)

    response.assertStatus(200)
    const data = response.body()
    assert.equal(data.id, note.id)
    assert.equal(data.title, 'Illustrated Notes')
    assert.equal(data.noteType, NoteType.SUMMARY)
    assert.equal(data.status, NoteStatus.PUBLISHED)
    assert.equal(data.price, 1500)
    assert.lengthOf(data.pages, 2)
    assert.deepEqual(
      data.pages.map((page: any) => page.sortOrder),
      [0, 1]
    )
    assert.isString(data.pages[0].url)
    assert.equal(data.pages[0].mimeType, 'image/png')

    const pageWithUpload = data.pages.find((page: any) => page.uploadId === firstPage.id)
    assert.equal(pageWithUpload.url, firstPage.url)
  })

  test('returns 404 for an unknown note and 422 for malformed ids', async ({ client, assert }) => {
    const missing = await client.get('/api/v1/notes/00000000-0000-4000-8000-000000000000')
    missing.assertStatus(404)
    assert.equal(missing.body().error.code, 'NOTE_NOT_FOUND')

    const malformed = await client.get('/api/v1/notes/not-a-uuid')
    malformed.assertStatus(422)
    assert.equal(malformed.body().error.code, 'INVALID_UUID_FORMAT_STRING')

    const malformedCourse = await client.get('/api/v1/courses/not-a-uuid/notes')
    malformedCourse.assertStatus(422)
    assert.equal(malformedCourse.body().error.code, 'INVALID_UUID_FORMAT_STRING')
  })
})
