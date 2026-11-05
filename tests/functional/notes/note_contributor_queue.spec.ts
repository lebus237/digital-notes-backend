import { test } from '@japa/runner'
import { NoteStatus, NoteType } from '#kernel/organisation/domain/types/index'
import {
  createContributor,
  createUser,
  loginAs,
  seedAcademicStructure,
  seedNote,
  truncateAll,
} from '../support/helpers.js'

test.group('Notes / contributor queue', (group) => {
  group.each.setup(truncateAll)

  test('lists only the authenticated contributor notes', async ({ client, assert }) => {
    const owner = await createContributor()
    const other = await createContributor()
    const token = await loginAs(client, owner)
    const structure = await seedAcademicStructure()

    const own = await seedNote({
      courseId: structure.course.id,
      uploadedBy: owner.id,
      title: 'My draft',
      status: NoteStatus.DRAFT,
    })
    await seedNote({
      courseId: structure.course.id,
      uploadedBy: other.id,
      title: 'Other draft',
      status: NoteStatus.DRAFT,
    })

    const response = await client.get('/api/v1/contributor/notes').bearerToken(token)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].id, own.id)
    assert.equal(response.body().data[0].status, NoteStatus.DRAFT)
    assert.equal(response.body().data[0].courseCode, structure.course.code)
    assert.equal(response.body().data[0].courseName, structure.course.name)
  })

  test('filters own notes by status, type and search', async ({ client, assert }) => {
    const contributor = await createContributor()
    const token = await loginAs(client, contributor)
    const structure = await seedAcademicStructure()

    await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Revision notes',
      status: NoteStatus.PENDING_REVIEW,
      noteType: NoteType.REVISION,
    })
    await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Past paper',
      status: NoteStatus.PUBLISHED,
      noteType: NoteType.PAST_EXAM,
    })

    const byStatus = await client
      .get('/api/v1/contributor/notes')
      .bearerToken(token)
      .qs({ status: NoteStatus.PENDING_REVIEW })
    byStatus.assertStatus(200)
    assert.lengthOf(byStatus.body().data, 1)

    const byType = await client
      .get('/api/v1/contributor/notes')
      .bearerToken(token)
      .qs({ noteType: NoteType.PAST_EXAM })
    byType.assertStatus(200)
    assert.lengthOf(byType.body().data, 1)

    const bySearch = await client
      .get('/api/v1/contributor/notes')
      .bearerToken(token)
      .qs({ q: 'revision' })
    bySearch.assertStatus(200)
    assert.lengthOf(bySearch.body().data, 1)
    assert.equal(bySearch.body().data[0].title, 'Revision notes')
  })

  test('protects the contributor queue', async ({ client }) => {
    const student = await createUser()
    const studentToken = await loginAs(client, student)

    const anonymous = await client.get('/api/v1/contributor/notes')
    anonymous.assertStatus(401)

    const forbidden = await client
      .get('/api/v1/contributor/notes')
      .bearerToken(studentToken)
    forbidden.assertStatus(403)
  })
})
