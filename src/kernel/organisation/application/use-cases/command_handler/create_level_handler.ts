import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { CreateLevelCommand } from '#kernel/organisation/application/use-cases/command/create_level_command'
import { LevelRepository } from '#kernel/organisation/domain/repository/level_repository'
import { DepartmentRepository } from '#kernel/organisation/domain/repository/department_repository'
import { Level } from '#kernel/organisation/domain/entity/level'
import { DepartmentNotFoundError } from '#kernel/organisation/domain/errors/department_not_found_error'

export class CreateLevelHandler implements CommandHandler<CreateLevelCommand, string> {
  constructor(
    private readonly levels: LevelRepository,
    private readonly departments: DepartmentRepository
  ) {}

  async handle(command: CreateLevelCommand): Promise<string> {
    const department = await this.departments.findById(command.departmentId)

    if (!department) {
      throw new DepartmentNotFoundError()
    }

    const id = (await this.levels.save(
      new Level(null, command.departmentId, command.name, null, null)
    )) as string

    return id
  }
}
