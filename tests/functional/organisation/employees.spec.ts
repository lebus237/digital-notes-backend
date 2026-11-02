import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserRole } from '#kernel/user/domain/types/user_role'
import {
  createAdmin,
  createUser,
  loginAs,
  seedAcademicStructure,
  uniqueEmail,
  uniquePhoneNumber,
} from '../support/helpers.js'

test.group('Organisation / employees', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  function employeePayload(universityId: string) {
    return {
      universityId,
      fullName: 'New Employee',
      email: uniqueEmail('employee'),
      phoneNumber: uniquePhoneNumber(),
      role: UserRole.CONTRIBUTOR,
    }
  }

  test('protects the employee directory', async ({ client }) => {
    const student = await createUser()
    const token = await loginAs(client, student)

    const anonymous = await client.get('/api/v1/admin/employees')
    anonymous.assertStatus(401)

    const forbidden = await client.get('/api/v1/admin/employees').bearerToken(token)
    forbidden.assertStatus(403)
  })

  test('lists and filters employees', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const first = await seedAcademicStructure()
    const second = await seedAcademicStructure()

    const created = await client
      .post('/api/v1/admin/employees')
      .bearerToken(token)
      .json({
        ...employeePayload(first.university.id),
        fullName: 'Grace Hopper',
        email: uniqueEmail('grace'),
      })
    created.assertStatus(201)

    const all = await client.get('/api/v1/admin/employees').bearerToken(token)
    all.assertStatus(200)
    assert.lengthOf(all.body().data, 1)
    assert.equal(all.body().data[0].fullName, 'Grace Hopper')
    assert.equal(all.body().data[0].universityName, first.university.name)
    assert.equal(all.body().data[0].role, UserRole.CONTRIBUTOR)

    const byUniversity = await client
      .get('/api/v1/admin/employees')
      .bearerToken(token)
      .qs({ universityId: second.university.id })
    byUniversity.assertStatus(200)
    assert.lengthOf(byUniversity.body().data, 0)

    const bySearch = await client
      .get('/api/v1/admin/employees')
      .bearerToken(token)
      .qs({ q: 'hopper' })
    bySearch.assertStatus(200)
    assert.lengthOf(bySearch.body().data, 1)
  })

  test('shows a single employee', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()

    const created = await client
      .post('/api/v1/admin/employees')
      .bearerToken(token)
      .json(employeePayload(structure.university.id))
    created.assertStatus(201)

    const response = await client
      .get(`/api/v1/admin/employees/${created.body().id}`)
      .bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().id, created.body().id)
    assert.equal(response.body().universityId, structure.university.id)
    assert.equal(response.body().universityName, structure.university.name)
  })

  test('returns 404 for an unknown employee and 422 for a malformed id', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)

    const missing = await client
      .get('/api/v1/admin/employees/00000000-0000-4000-8000-000000000000')
      .bearerToken(token)
    missing.assertStatus(404)
    assert.equal(missing.body().error.code, 'EMPLOYEE_NOT_FOUND')

    const malformed = await client.get('/api/v1/admin/employees/not-a-uuid').bearerToken(token)
    malformed.assertStatus(422)
    assert.equal(malformed.body().error.code, 'INVALID_UUID_FORMAT_STRING')
  })

  test('creates an employee account with a working temporary password', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()
    const payload = {
      ...employeePayload(structure.university.id),
      fullName: 'Katherine Johnson',
      role: UserRole.ADMINISTRATOR,
    }

    const response = await client.post('/api/v1/admin/employees').bearerToken(token).json(payload)

    response.assertStatus(201)
    assert.isString(response.body().temporaryPassword)

    const login = await client.post('/api/login').json({
      email: payload.email,
      password: response.body().temporaryPassword,
    })
    login.assertStatus(200)
    assert.equal(login.body().data.user.role, UserRole.ADMINISTRATOR)
    assert.equal(login.body().data.user.fullName, 'Katherine Johnson')
  })

  test('rejects duplicate employee accounts', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()
    const payload = employeePayload(structure.university.id)

    const first = await client.post('/api/v1/admin/employees').bearerToken(token).json(payload)
    first.assertStatus(201)

    const duplicate = await client
      .post('/api/v1/admin/employees')
      .bearerToken(token)
      .json({ ...payload, phoneNumber: uniquePhoneNumber() })

    duplicate.assertStatus(409)
    assert.equal(duplicate.body().error.code, 'EMPLOYEE_ALREADY_EXISTS')
  })

  test('rejects an employee for an unknown university', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)

    const response = await client
      .post('/api/v1/admin/employees')
      .bearerToken(token)
      .json(employeePayload('00000000-0000-4000-8000-000000000000'))

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'ORGANISATION_UNIVERSITY_NOT_FOUND')
  })

  test('validates the employee payload', async ({ client, assert }) => {
    const admin = await createAdmin()
    const token = await loginAs(client, admin)
    const structure = await seedAcademicStructure()

    const response = await client
      .post('/api/v1/admin/employees')
      .bearerToken(token)
      .json({
        ...employeePayload(structure.university.id),
        email: 'not-an-email',
        role: 'superuser',
      })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'VALIDATION_ERROR')
    assert.include(JSON.stringify(response.body().error.details), 'email')
    assert.include(JSON.stringify(response.body().error.details), 'role')
  })
})
