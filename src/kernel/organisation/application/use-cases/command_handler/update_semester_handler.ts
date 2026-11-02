import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { UpdateSemesterCommand } from '#kernel/organisation/application/use-cases/command/update_semester_command'
import { SemesterRepository } from '#kernel/organisation/domain/repository/semester_repository'
import { Semester } from '#kernel/organisation/domain/entity/semester'
import { SemesterNotFoundError } from '#kernel/organisation/domain/errors/semester_not_found_error'

export class UpdateSemesterHandler implements CommandHandler<UpdateSemesterCommand, void> {
  constructor(private readonly semesters: SemesterRepository) {}

  async handle(command: UpdateSemesterCommand): Promise<void> {
    const semester = await this.semesters.findById(command.id)

    if (!semester) {
      throw new SemesterNotFoundError()
    }

    await this.semesters.save(
      new Semester(
        command.id,
        semester.getDepartmentId(),
        command.name ?? semester.getName(),
        null,
        null
      )
    )
  }
}
