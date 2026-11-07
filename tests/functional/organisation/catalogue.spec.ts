import { test } from '@japa/runner'
import crypto from 'node:crypto'
import { UniversityRecord } from '#database/active-records/index'
import {
  createAdmin,
  createUser,
  loginAs,
  seedAcademicStructure,
  truncateAll,
} from '../support/helpers.js'

test.group('Organisation / catalogue', (group) => {
  group.each.setup(() => truncateAll())

  test('lists universities without authentication', async ({ client, assert }) => {
    const first = await seedAcademicStructure()
    const second = await seedAcademicStructure()

    const response = await client.get('/api/v1/universities')

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.meta.total, 2)
    assert.deepEqual(
      body.data.map((item: { id: string }) => item.id).sort(),
      [first.university.id, second.university.id].sort()
    )
    assert.isString(body.data[0].name)
  })

  test('clamps out-of-range pagination values', async ({ client, assert }) => {
    await seedAcademicStructure()

    const response = await client.get('/api/v1/universities?page=-1&limit=500')

    response.assertStatus(200)
    assert.equal(response.body().meta.currentPage, 1)
    assert.equal(response.body().meta.perPage, 100)
  })

  test('paginates collections', async ({ client, assert }) => {
    await seedAcademicStructure()
    await seedAcademicStructure()
    await seedAcademicStructure()

    const firstPage = await client.get('/api/v1/universities?page=1&limit=2')
    firstPage.assertStatus(200)
    assert.lengthOf(firstPage.body().data, 2)
    assert.equal(firstPage.body().meta.total, 3)

    const secondPage = await client.get('/api/v1/universities?page=2&limit=2')
    secondPage.assertStatus(200)
    assert.lengthOf(secondPage.body().data, 1)
  })

  test('supports nested page[offset] and page[limit] query params', async ({ client, assert }) => {
    await seedAcademicStructure()
    await seedAcademicStructure()
    await seedAcademicStructure()

    const response = await client.get('/api/v1/universities?page[offset]=2&page[limit]=2')

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().meta.currentPage, 2)
    assert.equal(response.body().meta.perPage, 2)
  })

  test('searches collections by name', async ({ client, assert }) => {
    const structure = await seedAcademicStructure()
    await seedAcademicStructure()

    const response = await client
      .get('/api/v1/universities')
      .qs({ q: structure.university.name.slice(-8) })

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].id, structure.university.id)
  })

  test('rejects malformed relation filters', async ({ client, assert }) => {
    const response = await client.get('/api/v1/faculties?universityId=not-a-uuid')

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'INVALID_UUID_FORMAT_STRING')
  })

  test('exposes public detail pages for the catalogue hierarchy', async ({ client, assert }) => {
    const structure = await seedAcademicStructure()

    const university = await client.get(`/api/v1/universities/${structure.university.id}`)
    university.assertStatus(200)
    assert.equal(university.body().name, structure.university.name)

    const faculty = await client.get(`/api/v1/faculties/${structure.faculty.id}`)
    faculty.assertStatus(200)
    assert.equal(faculty.body().name, structure.faculty.name)
    assert.equal(faculty.body().universityId, structure.university.id)

    const department = await client.get(`/api/v1/departments/${structure.department.id}`)
    department.assertStatus(200)
    assert.equal(department.body().name, structure.department.name)
    assert.equal(department.body().facultyId, structure.faculty.id)

    const missing = await client.get(`/api/v1/universities/${crypto.randomUUID()}`)
    missing.assertStatus(404)
  })

  test('creates a university as an administrator', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)

    const response = await client
      .post('/api/v1/admin/universities')
      .bearerToken(token)
      .json({ name: 'Makerere University' })

    response.assertStatus(201)
    const id = response.body().id as string
    assert.isString(id)

    const stored = await UniversityRecord.findOrFail(id)
    assert.equal(stored.name, 'Makerere University')
    assert.match(stored.slug, /^makerere-university-/)
  })

  test('protects catalogue writes', async ({ client }) => {
    const student = await createUser()
    const studentToken = await loginAs(client, student)

    const anonymous = await client
      .post('/api/v1/admin/universities')
      .json({ name: 'Some University' })
    anonymous.assertStatus(401)

    const forbidden = await client
      .post('/api/v1/admin/universities')
      .bearerToken(studentToken)
      .json({ name: 'Some University' })
    forbidden.assertStatus(403)
  })

  test('validates organisation names', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)

    const response = await client
      .post('/api/v1/admin/universities')
      .bearerToken(token)
      .json({ name: 'A' })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
  })

  test('creates a faculty for an existing university', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()

    const response = await client
      .post('/api/v1/admin/faculties')
      .bearerToken(token)
      .json({ universityId: structure.university.id, name: 'School of Computing' })

    response.assertStatus(201)

    const list = await client.get('/api/v1/faculties').qs({ universityId: structure.university.id })
    list.assertStatus(200)
    assert.lengthOf(list.body().data, 2)
    assert.include(
      list.body().data.map((item: { name: string }) => item.name),
      'School of Computing'
    )
  })

  test('rejects a faculty for an unknown university', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)

    const response = await client.post('/api/v1/admin/faculties').bearerToken(token).json({
      universityId: '00000000-0000-4000-8000-000000000000',
      name: 'Orphan Faculty',
    })

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'ORGANISATION_UNIVERSITY_NOT_FOUND')
  })

  test('creates departments, levels and semesters', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()

    const department = await client
      .post('/api/v1/admin/departments')
      .bearerToken(token)
      .json({ facultyId: structure.faculty.id, name: 'Computer Science' })
    department.assertStatus(201)

    const level = await client
      .post('/api/v1/admin/levels')
      .bearerToken(token)
      .json({ departmentId: structure.department.id, name: 'Year Four', year: 4 })
    level.assertStatus(201)

    const semester = await client
      .post('/api/v1/admin/semesters')
      .bearerToken(token)
      .json({ departmentId: structure.department.id, name: 'Semester Two' })
    semester.assertStatus(201)

    const departments = await client
      .get('/api/v1/departments')
      .qs({ facultyId: structure.faculty.id })
    departments.assertStatus(200)
    assert.lengthOf(departments.body().data, 2)
    assert.equal(departments.body().data[0].facultyName, structure.faculty.name)

    const levels = await client.get('/api/v1/levels').qs({ departmentId: structure.department.id })
    levels.assertStatus(200)
    assert.lengthOf(levels.body().data, 2)
    assert.equal(levels.body().data[0].departmentId, structure.department.id)
    assert.deepEqual(
      levels.body().data.map((item: { year: number }) => item.year),
      [1, 4]
    )

    const semesters = await client
      .get('/api/v1/semesters')
      .qs({ departmentId: structure.department.id })
    semesters.assertStatus(200)
    assert.lengthOf(semesters.body().data, 2)
    assert.equal(semesters.body().data[0].departmentId, structure.department.id)
    assert.isString(semesters.body().data[0].createdAt)
    assert.isString(semesters.body().data[0].updatedAt)
  })

  test('rejects levels and departments under unknown parents', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const missingId = '00000000-0000-4000-8000-000000000000'

    const department = await client
      .post('/api/v1/admin/departments')
      .bearerToken(token)
      .json({ facultyId: missingId, name: 'Orphan Department' })
    department.assertStatus(404)
    assert.equal(department.body().error.code, 'ORGANISATION_FACULTY_NOT_FOUND')

    const level = await client
      .post('/api/v1/admin/levels')
      .bearerToken(token)
      .json({ departmentId: missingId, name: 'Orphan Level', year: 1 })
    level.assertStatus(404)
    assert.equal(level.body().error.code, 'ORGANISATION_DEPARTMENT_NOT_FOUND')

    const semester = await client
      .post('/api/v1/admin/semesters')
      .bearerToken(token)
      .json({ departmentId: missingId, name: 'Orphan Semester' })
    semester.assertStatus(404)
    assert.equal(semester.body().error.code, 'ORGANISATION_DEPARTMENT_NOT_FOUND')
  })

  test('rejects malformed ids in write payloads', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)

    const response = await client
      .post('/api/v1/admin/faculties')
      .bearerToken(token)
      .json({ universityId: crypto.randomUUID().replace(/-/g, ''), name: 'No Dashes Faculty' })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
  })

  test('validates level year and rejects duplicate years', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()

    const missingYear = await client
      .post('/api/v1/admin/levels')
      .bearerToken(token)
      .json({ departmentId: structure.department.id, name: 'No Year' })
    missingYear.assertStatus(422)
    assert.equal(missingYear.body().error.code, 'VALIDATION_ERROR')

    const outOfRange = await client
      .post('/api/v1/admin/levels')
      .bearerToken(token)
      .json({ departmentId: structure.department.id, name: 'Out Of Range', year: 99 })
    outOfRange.assertStatus(422)
    assert.equal(outOfRange.body().error.code, 'VALIDATION_ERROR')

    const duplicate = await client
      .post('/api/v1/admin/levels')
      .bearerToken(token)
      .json({ departmentId: structure.department.id, name: 'Duplicate Year', year: 1 })
    duplicate.assertStatus(409)
    assert.equal(duplicate.body().error.code, 'ORGANISATION_LEVEL_ALREADY_EXISTS')

    const third = await client
      .post('/api/v1/admin/levels')
      .bearerToken(token)
      .json({ departmentId: structure.department.id, name: 'Year Three', year: 3 })
    third.assertStatus(201)

    const renameToDuplicate = await client
      .patch(`/api/v1/admin/levels/${structure.level.id}`)
      .bearerToken(token)
      .json({ year: 3 })
    renameToDuplicate.assertStatus(409)
    assert.equal(renameToDuplicate.body().error.code, 'ORGANISATION_LEVEL_ALREADY_EXISTS')

    const rename = await client
      .patch(`/api/v1/admin/levels/${structure.level.id}`)
      .bearerToken(token)
      .json({ name: 'Renamed Level', year: 2 })
    rename.assertStatus(204)

    const levels = await client.get('/api/v1/levels').qs({ departmentId: structure.department.id })
    levels.assertStatus(200)
    assert.deepEqual(
      levels.body().data.map((item: { year: number }) => item.year),
      [2, 3]
    )
    assert.equal(levels.body().data[0].name, 'Renamed Level')
  })
})
