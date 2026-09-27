import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { CreateEmployeeHandler } from '#kernel/employee/application/use-cases/command_handler/create_employee_handler'
import { CreateEmployeeCommand } from '#kernel/employee/application/use-cases/command/create_employee_command'
import { EmployeeRepository } from '#kernel/employee/domain/repository/employee_repository'
import { UniversityRepository } from '#kernel/organisation/domain/repository/university_repository'
import { UserRepository } from '#kernel/user/domain/repository/user_repository'
import { University } from '#kernel/organisation/domain/entity/university'
import { AppId } from '#shared/domain/app_id'
import { UserRole } from '#kernel/user/domain/types/user_role'
import { UniversityNotFoundError } from '#kernel/organisation/domain/errors/university_not_found_error'
import { EmployeeAlreadyExistsError } from '#kernel/employee/domain/errors/employee_already_exists_error'
import { UserAlreadyExistsError } from '#kernel/user/domain/errors/user_already_exists_error'

test.group('CreateEmployeeHandler', () => {
  const UNIVERSITY_ID = '00000000-0000-4000-8000-000000000001'
  const USER_ID = '00000000-0000-4000-8000-000000000002'
  const EMPLOYEE_ID = '00000000-0000-4000-8000-000000000003'

  const university = new University(
    AppId.fromString(UNIVERSITY_ID),
    'Test University',
    'test-university',
    DateTime.now(),
    null
  )

  function command() {
    return new CreateEmployeeCommand(
      AppId.fromString(UNIVERSITY_ID),
      'Jane Doe',
      'jane@example.com',
      '0712345678',
      UserRole.CONTRIBUTOR
    )
  }

  const universities: UniversityRepository = {
    save: async () => {},
    findById: async () => university,
    delete: async () => {},
  }

  const employees: EmployeeRepository = {
    save: async () => EMPLOYEE_ID,
    findById: async () => null,
    delete: async () => {},
  }

  const users: UserRepository = {
    save: async () => USER_ID,
    findById: async () => null,
    delete: async () => {},
  }

  test('creates user then employee and returns the temporary password', async ({ assert }) => {
    const savedRoles: UserRole[] = []
    const handler = new CreateEmployeeHandler(employees, universities, {
      ...users,
      save: async (user) => {
        savedRoles.push(user.getRole())
        assert.equal(user.getFullName(), 'Jane Doe')
        assert.isNotNull(user.getPassword())
        return USER_ID
      },
    })

    const result = await handler.handle(command())

    assert.equal(result.id, EMPLOYEE_ID)
    assert.isString(result.temporaryPassword)
    assert.deepEqual(savedRoles, [UserRole.CONTRIBUTOR])
  })

  test('rejects unknown university without touching users', async ({ assert }) => {
    let userSaveCalled = false
    const handler = new CreateEmployeeHandler(
      employees,
      { ...universities, findById: async () => null },
      {
        ...users,
        save: async () => {
          userSaveCalled = true
          return USER_ID
        },
      }
    )

    try {
      await handler.handle(command())
      assert.fail('Should have thrown')
    } catch (error) {
      assert.instanceOf(error, UniversityNotFoundError)
    }

    assert.isFalse(userSaveCalled)
  })

  test('maps duplicate accounts to employee conflict', async ({ assert }) => {
    const handler = new CreateEmployeeHandler(employees, universities, {
      ...users,
      save: async () => {
        throw new UserAlreadyExistsError()
      },
    })

    try {
      await handler.handle(command())
      assert.fail('Should have thrown')
    } catch (error) {
      assert.instanceOf(error, EmployeeAlreadyExistsError)
    }
  })

  test('rolls back the user when employee save fails', async ({ assert }) => {
    let deletedUserId: string | undefined
    const handler = new CreateEmployeeHandler(
      {
        ...employees,
        save: async () => {
          throw new Error('employee save failed')
        },
      },
      universities,
      {
        ...users,
        delete: async (id: string) => {
          deletedUserId = id
        },
      }
    )

    try {
      await handler.handle(command())
      assert.fail('Should have thrown')
    } catch (error) {
      assert.instanceOf(error, Error)
    }

    assert.equal(deletedUserId, USER_ID)
  })
})
