import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { CreateUniversityCommand } from '#kernel/organisation/application/command/create_university_command'
import { UniversityRepository } from '#kernel/organisation/domain/repository/university_repository'
import { University } from '#kernel/organisation/domain/entity/university'

export class CreateUniversityHandler implements CommandHandler<CreateUniversityCommand, string> {
  constructor(private readonly repository: UniversityRepository) {}

  async handle(command: CreateUniversityCommand): Promise<string> {
    const id = (await this.repository.save(
      new University(null, command.name, command.slug, null, null)
    )) as string

    return id
  }
}
