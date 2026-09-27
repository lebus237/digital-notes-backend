import crypto from 'node:crypto'
import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { CreateEmployeeCommand } from '#kernel/employee/application/use-cases/command/create_employee_command'
import { EmployeeRepository } from '#kernel/employee/domain/repository/employee_repository'
import { UniversityRepository } from '#kernel/organisation/domain/repository/university_repository'
import { UserRepository } from '#kernel/user/domain/repository/user_repository'
import { Employee } from '#kernel/employee/domain/entity/employee'
import { User } from '#kernel/user/domain/entity/user'
import { UniversityNotFoundError } from '#kernel/organisation/domain/errors/university_not_found_error'
import { EmployeeAlreadyExistsError } from '#kernel/employee/domain/errors/employee_already_exists_error'
import { UserAlreadyExistsError } from '#kernel/user/domain/errors/user_already_exists_error'

function generateTemporaryPassword(): string {
  return `${crypto.randomBytes(6).toString('base64url')}A1a`
}

export type CreateEmployeeResult = {
  id: string
  temporaryPassword: string
}

export class CreateEmployeeHandler implements CommandHandler<
  CreateEmployeeCommand,
  CreateEmployeeResult
> {
  constructor(
    private readonly employees: EmployeeRepository,
    private readonly universities: UniversityRepository,
    private readonly users: UserRepository
  ) {}

  async handle(command: CreateEmployeeCommand): Promise<CreateEmployeeResult> {
    const university = await this.universities.findById(command.universityId)

    if (!university) {
      throw new UniversityNotFoundError()
    }

    const temporaryPassword = generateTemporaryPassword()

    let userId: string

    try {
      userId = (await this.users.save(
        new User(
          null,
          command.fullName,
          command.email,
          command.phoneNumber,
          command.role,
          temporaryPassword,
          null,
          null
        )
      )) as string
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        throw new EmployeeAlreadyExistsError()
      }
      throw error
    }

    try {
      const id = (await this.employees.save(
        new Employee(null, command.universityId.value, userId, null, null)
      )) as string

      return { id, temporaryPassword }
    } catch (error) {
      await this.users.delete(userId)

      if (error instanceof UserAlreadyExistsError) {
        throw new EmployeeAlreadyExistsError()
      }
      throw error
    }
  }
}
