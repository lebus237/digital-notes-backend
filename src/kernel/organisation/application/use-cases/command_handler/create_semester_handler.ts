import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { CreateSemesterCommand } from '#kernel/organisation/application/use-cases/command/create_semester_command'
import { SemesterRepository } from '#kernel/organisation/domain/repository/semester_repository'
import { DepartmentRepository } from '#kernel/organisation/domain/repository/department_repository'
import { Semester } from '#kernel/organisation/domain/entity/semester'
import { DepartmentNotFoundError } from '#kernel/organisation/domain/errors/department_not_found_error'

export class CreateSemesterHandler implements CommandHandler<CreateSemesterCommand, string> {
  constructor(
    private readonly semesters: SemesterRepository,
    private readonly departments: DepartmentRepository
  ) {}

  async handle(command: CreateSemesterCommand): Promise<string> {
    const department = await this.departments.findById(command.departmentId)

    if (!department) {
      throw new DepartmentNotFoundError()
    }

    const id = (await this.semesters.save(
      new Semester(null, command.departmentId.value, command.name, null, null)
    )) as string

    return id
  }
}
