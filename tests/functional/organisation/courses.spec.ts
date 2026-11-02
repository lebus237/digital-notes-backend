import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { CourseRecord } from '#database/active-records/index'
import { createAdmin, createUser, loginAs, seedAcademicStructure } from '../support/helpers.js'

test.group('Organisation / courses', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('lists visible courses with their academic context', async ({ client, assert }) => {
    const structure = await seedAcademicStructure()
    await CourseRecord.create({
      departmentId: structure.department.id,
      levelId: structure.level.id,
      semesterId: structure.semester.id,
      code: `ARCH-${structure.course.id.slice(0, 6)}`,
      name: 'Archived Course',
      description: null,
      lecturerName: null,
      isArchived: true,
    })

    const response = await client.get('/api/v1/courses')

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    const course = response.body().data[0]
    assert.equal(course.id, structure.course.id)
    assert.equal(course.departmentName, structure.department.name)
    assert.equal(course.levelName, structure.level.name)
    assert.equal(course.semesterName, structure.semester.name)
  })

  test('filters courses by department, level and semester', async ({ client, assert }) => {
    const first = await seedAcademicStructure()
    const second = await seedAcademicStructure()

    const byDepartment = await client
      .get('/api/v1/courses')
      .qs({ departmentId: first.department.id })
    byDepartment.assertStatus(200)
    assert.lengthOf(byDepartment.body().data, 1)
    assert.equal(byDepartment.body().data[0].id, first.course.id)

    const byLevel = await client.get('/api/v1/courses').qs({ levelId: second.level.id })
    byLevel.assertStatus(200)
    assert.equal(byLevel.body().data[0].id, second.course.id)

    const bySemester = await client.get('/api/v1/courses').qs({ semesterId: second.semester.id })
    bySemester.assertStatus(200)
    assert.equal(bySemester.body().data[0].id, second.course.id)
  })

  test('searches courses by name, code and lecturer', async ({ client, assert }) => {
    const structure = await seedAcademicStructure()
    await CourseRecord.create({
      departmentId: structure.department.id,
      levelId: structure.level.id,
      semesterId: structure.semester.id,
      code: 'BIO201',
      name: 'Molecular Biology',
      description: null,
      lecturerName: 'Dr Grace Hopper',
      isArchived: false,
    })

    const byName = await client.get('/api/v1/courses').qs({ q: 'molecular' })
    byName.assertStatus(200)
    assert.lengthOf(byName.body().data, 1)
    assert.equal(byName.body().data[0].code, 'BIO201')

    const byLecturer = await client.get('/api/v1/courses').qs({ q: 'hopper' })
    byLecturer.assertStatus(200)
    assert.lengthOf(byLecturer.body().data, 1)

    const byCode = await client.get('/api/v1/courses').qs({ q: 'BIO2' })
    byCode.assertStatus(200)
    assert.lengthOf(byCode.body().data, 1)
  })

  test('shows a single course', async ({ client, assert }) => {
    const structure = await seedAcademicStructure()

    const response = await client.get(`/api/v1/courses/${structure.course.id}`)

    response.assertStatus(200)
    assert.equal(response.body().id, structure.course.id)
    assert.equal(response.body().departmentId, structure.department.id)
    assert.equal(response.body().levelId, structure.level.id)
    assert.equal(response.body().semesterId, structure.semester.id)
  })

  test('returns 404 for an unknown course and 422 for a malformed id', async ({
    client,
    assert,
  }) => {
    const missing = await client.get('/api/v1/courses/00000000-0000-4000-8000-000000000000')
    missing.assertStatus(404)
    assert.equal(missing.body().error.code, 'ORGANISATION_COURSE_NOT_FOUND')

    const malformed = await client.get('/api/v1/courses/not-a-uuid')
    malformed.assertStatus(422)
    assert.equal(malformed.body().error.code, 'INVALID_UUID_FORMAT_STRING')
  })

  test('creates a course as an administrator', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()

    const response = await client.post('/api/v1/admin/courses').bearerToken(token).json({
      departmentId: structure.department.id,
      levelId: structure.level.id,
      semesterId: structure.semester.id,
      code: 'CS101',
      name: 'Introduction to Programming',
      description: 'Variables, loops and functions',
      lecturerName: 'Dr Alan Turing',
    })

    response.assertStatus(201)
    const id = response.body().id as string

    const stored = await CourseRecord.findOrFail(id)
    assert.equal(stored.code, 'CS101')
    assert.equal(stored.name, 'Introduction to Programming')
    assert.equal(stored.lecturerName, 'Dr Alan Turing')
    assert.isFalse(stored.isArchived)
  })

  test('protects course creation', async ({ client }) => {
    const student = await createUser()
    const token = await loginAs(client, student)
    const structure = await seedAcademicStructure()
    const payload = {
      departmentId: structure.department.id,
      levelId: structure.level.id,
      semesterId: structure.semester.id,
      code: 'CS102',
      name: 'Data Structures',
    }

    const anonymous = await client.post('/api/v1/admin/courses').json(payload)
    anonymous.assertStatus(401)

    const forbidden = await client.post('/api/v1/admin/courses').bearerToken(token).json(payload)
    forbidden.assertStatus(403)
  })

  test('validates the course payload', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()

    const response = await client.post('/api/v1/admin/courses').bearerToken(token).json({
      departmentId: structure.department.id,
      levelId: structure.level.id,
      semesterId: structure.semester.id,
      code: 'C',
      name: 'A',
    })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
    assert.include(JSON.stringify(response.body().error.details), 'code')
    assert.include(JSON.stringify(response.body().error.details), 'name')
  })

  test('rejects courses with unknown or inconsistent relations', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const first = await seedAcademicStructure()
    const second = await seedAcademicStructure()

    const missingDepartment = await client.post('/api/v1/admin/courses').bearerToken(token).json({
      departmentId: '00000000-0000-4000-8000-000000000000',
      levelId: first.level.id,
      semesterId: first.semester.id,
      code: 'ORPHAN1',
      name: 'Orphan Course',
    })
    missingDepartment.assertStatus(404)
    assert.equal(missingDepartment.body().error.code, 'ORGANISATION_DEPARTMENT_NOT_FOUND')

    const mismatchedLevel = await client.post('/api/v1/admin/courses').bearerToken(token).json({
      departmentId: first.department.id,
      levelId: second.level.id,
      semesterId: first.semester.id,
      code: 'MISMATCH1',
      name: 'Mismatched Course',
    })
    mismatchedLevel.assertStatus(422)
    assert.equal(mismatchedLevel.body().error.code, 'ORGANISATION_INVALID_HIERARCHY')

    const missingSemester = await client.post('/api/v1/admin/courses').bearerToken(token).json({
      departmentId: first.department.id,
      levelId: first.level.id,
      semesterId: '00000000-0000-4000-8000-000000000000',
      code: 'ORPHAN2',
      name: 'Orphan Semester Course',
    })
    missingSemester.assertStatus(404)
    assert.equal(missingSemester.body().error.code, 'ORGANISATION_SEMESTER_NOT_FOUND')

    const mismatchedSemester = await client.post('/api/v1/admin/courses').bearerToken(token).json({
      departmentId: first.department.id,
      levelId: first.level.id,
      semesterId: second.semester.id,
      code: 'MISMATCH2',
      name: 'Mismatched Semester Course',
    })
    mismatchedSemester.assertStatus(422)
    assert.equal(mismatchedSemester.body().error.code, 'ORGANISATION_INVALID_HIERARCHY')
  })

  test('updates a course', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()

    const response = await client
      .patch(`/api/v1/admin/courses/${structure.course.id}`)
      .bearerToken(token)
      .json({ name: 'Renamed Course', lecturerName: 'Dr Katherine Johnson' })

    response.assertStatus(204)

    const stored = await CourseRecord.findOrFail(structure.course.id)
    assert.equal(stored.name, 'Renamed Course')
    assert.equal(stored.lecturerName, 'Dr Katherine Johnson')
    assert.equal(stored.code, structure.course.code)
  })

  test('returns 404 when updating an unknown course', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)

    const response = await client
      .patch('/api/v1/admin/courses/00000000-0000-4000-8000-000000000000')
      .bearerToken(token)
      .json({ name: 'Ghost Course' })

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'ORGANISATION_COURSE_NOT_FOUND')
  })

  test('archives a course and hides it from public reads', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()

    const response = await client
      .post(`/api/v1/admin/courses/${structure.course.id}/archive`)
      .bearerToken(token)
    response.assertStatus(204)

    const stored = await CourseRecord.findOrFail(structure.course.id)
    assert.isTrue(stored.isArchived)

    const list = await client.get('/api/v1/courses')
    list.assertStatus(200)
    assert.lengthOf(list.body().data, 0)

    const show = await client.get(`/api/v1/courses/${structure.course.id}`)
    show.assertStatus(404)
  })

  test('returns 404 when archiving an unknown course', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)

    const response = await client
      .post('/api/v1/admin/courses/00000000-0000-4000-8000-000000000000/archive')
      .bearerToken(token)

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'ORGANISATION_COURSE_NOT_FOUND')
  })
})
