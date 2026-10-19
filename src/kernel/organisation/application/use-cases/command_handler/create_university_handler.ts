import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { CreateUniversityCommand } from '#kernel/organisation/application/use-cases/command/create_university_command'
import { UniversityRepository } from '#kernel/organisation/domain/repository/university_repository'
import { University } from '#kernel/organisation/domain/entity/university'
import { generateUniqueSlug } from '#shared/domain/slug'

export class CreateUniversityHandler implements CommandHandler<CreateUniversityCommand, string> {
  constructor(private readonly repository: UniversityRepository) {}

  async handle(command: CreateUniversityCommand): Promise<string> {
    const id = (await this.repository.save(
      new University(null, command.name, generateUniqueSlug(command.name), null, null)
    )) as string

    return id
  }
}
