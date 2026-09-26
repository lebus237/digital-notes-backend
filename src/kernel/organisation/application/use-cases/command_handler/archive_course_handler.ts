import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { ArchiveCourseCommand } from '#kernel/organisation/application/use-cases/command/archive_course_command'
import { CourseRepository } from '#kernel/organisation/domain/repository/course_repository'
import { CourseNotFoundError } from '#kernel/organisation/domain/errors/course_not_found_error'

export class ArchiveCourseHandler implements CommandHandler<ArchiveCourseCommand, void> {
  constructor(private readonly repository: CourseRepository) {}

  async handle(command: ArchiveCourseCommand): Promise<void> {
    const course = await this.repository.findById(command.id)

    if (!course) {
      throw new CourseNotFoundError()
    }

    course.archive()

    await this.repository.save(course)
  }
}
