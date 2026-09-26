import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { CreateFacultyCommand } from '#kernel/organisation/application/use-cases/command/create_faculty_command'
import { FacultyRepository } from '#kernel/organisation/domain/repository/faculty_repository'
import { UniversityRepository } from '#kernel/organisation/domain/repository/university_repository'
import { Faculty } from '#kernel/organisation/domain/entity/faculty'
import { UniversityNotFoundError } from '#kernel/organisation/domain/errors/university_not_found_error'

export class CreateFacultyHandler implements CommandHandler<CreateFacultyCommand, string> {
  constructor(
    private readonly faculties: FacultyRepository,
    private readonly universities: UniversityRepository
  ) {}

  async handle(command: CreateFacultyCommand): Promise<string> {
    const university = await this.universities.findById(command.universityId)

    if (!university) {
      throw new UniversityNotFoundError()
    }

    const id = (await this.faculties.save(
      new Faculty(null, command.universityId, command.name, command.slug, null, null)
    )) as string

    return id
  }
}
