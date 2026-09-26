import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { CreateDepartmentCommand } from '#kernel/organisation/application/use-cases/command/create_department_command'
import { DepartmentRepository } from '#kernel/organisation/domain/repository/department_repository'
import { FacultyRepository } from '#kernel/organisation/domain/repository/faculty_repository'
import { Department } from '#kernel/organisation/domain/entity/department'
import { FacultyNotFoundError } from '#kernel/organisation/domain/errors/faculty_not_found_error'

export class CreateDepartmentHandler implements CommandHandler<CreateDepartmentCommand, string> {
  constructor(
    private readonly departments: DepartmentRepository,
    private readonly faculties: FacultyRepository
  ) {}

  async handle(command: CreateDepartmentCommand): Promise<string> {
    const faculty = await this.faculties.findById(command.facultyId)

    if (!faculty) {
      throw new FacultyNotFoundError()
    }

    const id = (await this.departments.save(
      new Department(null, command.facultyId.value, command.name, command.slug, null, null)
    )) as string

    return id
  }
}
