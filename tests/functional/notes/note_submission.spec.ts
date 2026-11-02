import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { NotePageRecord, NoteRecord, UploadRecord } from '#database/active-records/index'
import { NoteStatus, NoteType } from '#kernel/organisation/domain/types/index'
import {
  ONE_PIXEL_PNG,
  createAdmin,
  createContributor,
  createUser,
  loginAs,
  seedAcademicStructure,
} from '../support/helpers.js'

test.group('Notes / submission', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('requires authentication and a contributor role', async ({ client }) => {
    const structure = await seedAcademicStructure()
    const student = await createUser()
    const studentToken = await loginAs(client, student)

    const anonymous = await client
      .post('/api/v1/notes')
      .field('courseId', structure.course.id)
      .field('title', 'Anonymous note')
      .file('pages', ONE_PIXEL_PNG, { filename: 'page.png', contentType: 'image/png' })
    anonymous.assertStatus(401)

    const forbidden = await client
      .post('/api/v1/notes')
      .bearerToken(studentToken)
      .field('courseId', structure.course.id)
      .field('title', 'Student note')
      .file('pages', ONE_PIXEL_PNG, { filename: 'page.png', contentType: 'image/png' })
    forbidden.assertStatus(403)
  })

  test('requires at least one page', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()

    const response = await client
      .post('/api/v1/notes')
      .bearerToken(token)
      .field('courseId', structure.course.id)
      .field('title', 'Page-less note')

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'NOTE_PAGES_REQUIRED')
    assert.equal(response.body().error.message, 'At least one page is required')
  })

  test('rejects unsupported page media types', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()

    const response = await client
      .post('/api/v1/notes')
      .bearerToken(token)
      .field('courseId', structure.course.id)
      .field('title', 'Zip note')
      .file('pages', Buffer.from('PK'), { filename: 'pages.zip', contentType: 'application/zip' })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'NOTE_PAGE_UNSUPPORTED_TYPE')
  })

  test('creates a draft note from uploaded pages', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()

    const response = await client
      .post('/api/v1/notes')
      .bearerToken(token)
      .field('courseId', structure.course.id)
      .field('title', 'Week One Lecture Notes')
      .field('description', 'Introduction and course outline')
      .field('noteType', NoteType.LECTURE_NOTES)
      .file('pages', ONE_PIXEL_PNG, { filename: 'page-1.png', contentType: 'image/png' })

    response.assertStatus(201)
    const id = response.body().id as string
    assert.isString(id)

    const note = await NoteRecord.findOrFail(id)
    assert.equal(note.title, 'Week One Lecture Notes')
    assert.equal(note.description, 'Introduction and course outline')
    assert.equal(note.noteType, NoteType.LECTURE_NOTES)
    assert.equal(note.status, NoteStatus.DRAFT)
    assert.equal(note.uploadedBy, contributor.id)
    assert.equal(note.courseId, structure.course.id)

    const pages = await NotePageRecord.query().where('note_id', id)
    assert.lengthOf(pages, 1)
    assert.equal(pages[0].sortOrder, 0)

    const upload = await UploadRecord.findOrFail(pages[0].uploadId)
    assert.equal(upload.type, 'image')
    assert.equal(upload.createdBy, contributor.id)
    assert.equal(upload.mimeType, 'image/png')
  })

  test('preserves the order of multiple pages', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()

    const response = await client
      .post('/api/v1/notes')
      .bearerToken(token)
      .field('courseId', structure.course.id)
      .field('title', 'Three Page Note')
      .file('pages', ONE_PIXEL_PNG, { filename: 'page-1.png', contentType: 'image/png' })
      .file('pages', ONE_PIXEL_PNG, { filename: 'page-2.png', contentType: 'image/png' })
      .file('pages', ONE_PIXEL_PNG, { filename: 'page-3.png', contentType: 'image/png' })

    response.assertStatus(201)

    const pages = await NotePageRecord.query()
      .where('note_id', response.body().id)
      .orderBy('sort_order', 'asc')
    assert.lengthOf(pages, 3)
    assert.deepEqual(
      pages.map((page) => page.sortOrder),
      [0, 1, 2]
    )
  })

  test('lets an administrator submit a note too', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()

    const response = await client
      .post('/api/v1/notes')
      .bearerToken(token)
      .field('courseId', structure.course.id)
      .field('title', 'Administrator Note')
      .file('pages', ONE_PIXEL_PNG, { filename: 'page.png', contentType: 'image/png' })

    response.assertStatus(201)
    const note = await NoteRecord.findOrFail(response.body().id)
    assert.equal(note.uploadedBy, admin.id)
  })

  test('rejects notes for unknown or archived courses', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()

    const unknown = await client
      .post('/api/v1/notes')
      .bearerToken(token)
      .field('courseId', '00000000-0000-4000-8000-000000000000')
      .field('title', 'Orphan note')
      .file('pages', ONE_PIXEL_PNG, { filename: 'page.png', contentType: 'image/png' })
    unknown.assertStatus(404)
    assert.equal(unknown.body().error.code, 'ORGANISATION_COURSE_NOT_FOUND')

    structure.course.isArchived = true
    await structure.course.save()

    const archived = await client
      .post('/api/v1/notes')
      .bearerToken(token)
      .field('courseId', structure.course.id)
      .field('title', 'Archived course note')
      .file('pages', ONE_PIXEL_PNG, { filename: 'page.png', contentType: 'image/png' })
    archived.assertStatus(404)
    assert.equal(archived.body().error.code, 'ORGANISATION_COURSE_NOT_FOUND')
  })

  test('validates note metadata', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    await seedAcademicStructure()

    const response = await client
      .post('/api/v1/notes')
      .bearerToken(token)
      .field('courseId', 'not-a-uuid')
      .field('title', 'A')
      .field('price', '-5')
      .file('pages', ONE_PIXEL_PNG, { filename: 'page.png', contentType: 'image/png' })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
    const details = JSON.stringify(response.body().error.details)
    assert.include(details, 'courseId')
    assert.include(details, 'title')
  })
})
