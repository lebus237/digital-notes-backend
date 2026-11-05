import { test } from '@japa/runner'
import { NoteStatus, NoteType } from '#kernel/organisation/domain/types/index'
import {
  createAdmin,
  createContributor,
  loginAs,
  seedAcademicStructure,
  seedNote,
  truncateAll,
} from '../support/helpers.js'

test.group('Notes / admin queue', (group) => {
  group.each.setup(truncateAll)

  test('lists notes across courses with course metadata', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const first = await seedAcademicStructure()
    const second = await seedAcademicStructure()
    const contributor = await createContributor()

    const pending = await seedNote({
      courseId: first.course.id,
      uploadedBy: contributor.id,
      title: 'Pending note',
      status: NoteStatus.PENDING_REVIEW,
    })
    await seedNote({
      courseId: second.course.id,
      uploadedBy: contributor.id,
      title: 'Published note',
      status: NoteStatus.PUBLISHED,
    })
    await seedNote({
      courseId: first.course.id,
      uploadedBy: contributor.id,
      title: 'Rejected note',
      status: NoteStatus.REJECTED,
    })

    const response = await client.get('/api/v1/admin/notes').bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().meta.total, 3)

    const item = response.body().data.find((note: any) => note.id === pending.id)
    assert.equal(item.courseCode, first.course.code)
    assert.equal(item.courseName, first.course.name)
    assert.equal(item.status, NoteStatus.PENDING_REVIEW)
  })

  test('filters the queue by status, course and search term', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const first = await seedAcademicStructure()
    const second = await seedAcademicStructure()
    const contributor = await createContributor()

    await seedNote({
      courseId: first.course.id,
      uploadedBy: contributor.id,
      title: 'Database revision',
      status: NoteStatus.PENDING_REVIEW,
      noteType: NoteType.REVISION,
    })
    await seedNote({
      courseId: second.course.id,
      uploadedBy: contributor.id,
      title: 'Networks past paper',
      status: NoteStatus.PENDING_REVIEW,
      noteType: NoteType.PAST_EXAM,
    })
    await seedNote({
      courseId: first.course.id,
      uploadedBy: contributor.id,
      title: 'Published summary',
      status: NoteStatus.PUBLISHED,
      noteType: NoteType.SUMMARY,
    })

    const byStatus = await client
      .get('/api/v1/admin/notes')
      .bearerToken(token)
      .qs({ status: NoteStatus.PENDING_REVIEW })
    byStatus.assertStatus(200)
    assert.lengthOf(byStatus.body().data, 2)

    const byCourse = await client
      .get('/api/v1/admin/notes')
      .bearerToken(token)
      .qs({ courseId: first.course.id })
    byCourse.assertStatus(200)
    assert.lengthOf(byCourse.body().data, 2)

    const bySearch = await client
      .get('/api/v1/admin/notes')
      .bearerToken(token)
      .qs({ q: 'database' })
    bySearch.assertStatus(200)
    assert.lengthOf(bySearch.body().data, 1)
    assert.equal(bySearch.body().data[0].title, 'Database revision')
  })

  test('protects the admin queue', async ({ client }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)

    const anonymous = await client.get('/api/v1/admin/notes')
    anonymous.assertStatus(401)

    const forbidden = await client.get('/api/v1/admin/notes').bearerToken(token)
    forbidden.assertStatus(403)
  })
})
