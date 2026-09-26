import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { UpdateCourseCommand } from '#kernel/organisation/application/use-cases/command/update_course_command'
import { CourseRepository } from '#kernel/organisation/domain/repository/course_repository'
import { Course } from '#kernel/organisation/domain/entity/course'
import { CourseNotFoundError } from '#kernel/organisation/domain/errors/course_not_found_error'

export class UpdateCourseHandler implements CommandHandler<UpdateCourseCommand, void> {
  constructor(private readonly repository: CourseRepository) {}

  async handle(command: UpdateCourseCommand): Promise<void> {
    const course = await this.repository.findById(command.id)

    if (!course) {
      throw new CourseNotFoundError()
    }

    await this.repository.save(
      new Course(
        command.id,
        course.getDepartmentId(),
        course.getLevelId(),
        course.getSemesterId(),
        command.code ?? course.getCode(),
        command.name ?? course.getName(),
        command.description !== undefined ? command.description : course.getDescription(),
        course.getIsArchived(),
        null,
        null
      )
    )
  }
}
