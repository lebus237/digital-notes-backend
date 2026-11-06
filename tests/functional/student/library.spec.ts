import { test } from '@japa/runner'
import { NoteStatus } from '#kernel/organisation/domain/types/index'
import {
  createUser,
  loginAs,
  seedAcademicStructure,
  seedNote,
  seedNotePage,
  truncateAll,
} from '../support/helpers.js'

test.group('Student / library', (group) => {
  group.each.setup(() => truncateAll())

  test('requires an authenticated student', async ({ client }) => {
    const response = await client.get('/api/v1/student/profile')
    response.assertStatus(401)
  })

  test('updates the academic profile and returns resolved names', async ({ client, assert }) => {
    const student = await createUser({ fullName: 'Student User' })
    const token = await loginAs(client, student)
    const structure = await seedAcademicStructure()

    const initial = await client
      .get('/api/v1/student/profile')
      .bearerToken(token)
    initial.assertStatus(200)
    assert.isNull(initial.body().data.departmentId)

    const updated = await client
      .patch('/api/v1/student/profile')
      .bearerToken(token)
      .json({
        universityId: structure.university.id,
        facultyId: structure.faculty.id,
        departmentId: structure.department.id,
        levelId: structure.level.id,
        semesterId: structure.semester.id,
      })

    updated.assertStatus(200)
    assert.equal(updated.body().data.universityName, structure.university.name)
    assert.equal(updated.body().data.facultyName, structure.faculty.name)
    assert.equal(updated.body().data.departmentName, structure.department.name)
    assert.equal(updated.body().data.levelName, structure.level.name)
    assert.equal(updated.body().data.semesterName, structure.semester.name)
  })

  test('favorites and unfavorites a published note', async ({ client, assert }) => {
    const student = await createUser()
    const token = await loginAs(client, student)
    const structure = await seedAcademicStructure()
    const contributor = await createUser()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'Favorite candidate',
      status: NoteStatus.PUBLISHED,
    })
    await seedNotePage(note.id, 0, contributor.id)

    const empty = await client
      .get('/api/v1/student/favorites/ids')
      .bearerToken(token)
    empty.assertStatus(200)
    assert.deepEqual(empty.body().data.ids, [])

    const added = await client
      .post(`/api/v1/student/favorites/${note.id}`)
      .bearerToken(token)
    added.assertStatus(204)

    const ids = await client
      .get('/api/v1/student/favorites/ids')
      .bearerToken(token)
    ids.assertStatus(200)
    assert.deepEqual(ids.body().data.ids, [note.id])

    const favorites = await client
      .get('/api/v1/student/favorites')
      .bearerToken(token)
    favorites.assertStatus(200)
    assert.lengthOf(favorites.body().data, 1)
    assert.equal(favorites.body().data[0].id, note.id)
    assert.equal(favorites.body().data[0].courseCode, structure.course.code)

    const removed = await client
      .delete(`/api/v1/student/favorites/${note.id}`)
      .bearerToken(token)
    removed.assertStatus(204)

    const emptyAgain = await client
      .get('/api/v1/student/favorites')
      .bearerToken(token)
    emptyAgain.assertStatus(200)
    assert.lengthOf(emptyAgain.body().data, 0)
  })

  test('records and returns reading history', async ({ client, assert }) => {
    const student = await createUser()
    const token = await loginAs(client, student)
    const structure = await seedAcademicStructure()
    const contributor = await createUser()
    const note = await seedNote({
      courseId: structure.course.id,
      uploadedBy: contributor.id,
      title: 'History candidate',
      status: NoteStatus.PUBLISHED,
    })

    const recorded = await client
      .post(`/api/v1/student/history/${note.id}`)
      .bearerToken(token)
    recorded.assertStatus(204)

    const history = await client
      .get('/api/v1/student/history')
      .bearerToken(token)
    history.assertStatus(200)
    assert.lengthOf(history.body().data, 1)
    assert.equal(history.body().data[0].id, note.id)
  })
})
