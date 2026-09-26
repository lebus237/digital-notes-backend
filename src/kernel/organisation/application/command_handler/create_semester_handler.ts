import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { CreateSemesterCommand } from '#kernel/organisation/application/command/create_semester_command'
import { SemesterRepository } from '#kernel/organisation/domain/repository/semester_repository'
import { Semester } from '#kernel/organisation/domain/entity/semester'

export class CreateSemesterHandler implements CommandHandler<CreateSemesterCommand, string> {
  constructor(private readonly repository: SemesterRepository) {}

  async handle(command: CreateSemesterCommand): Promise<string> {
    const id = (await this.repository.save(
      new Semester(null, command.name, null, null)
    )) as string

    return id
  }
}
