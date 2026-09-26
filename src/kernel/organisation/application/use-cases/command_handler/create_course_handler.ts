import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { CreateCourseCommand } from '#kernel/organisation/application/use-cases/command/create_course_command'
import { CourseRepository } from '#kernel/organisation/domain/repository/course_repository'
import { DepartmentRepository } from '#kernel/organisation/domain/repository/department_repository'
import { LevelRepository } from '#kernel/organisation/domain/repository/level_repository'
import { SemesterRepository } from '#kernel/organisation/domain/repository/semester_repository'
import { Course } from '#kernel/organisation/domain/entity/course'
import { DepartmentNotFoundError } from '#kernel/organisation/domain/errors/department_not_found_error'
import { LevelNotFoundError } from '#kernel/organisation/domain/errors/level_not_found_error'
import { SemesterNotFoundError } from '#kernel/organisation/domain/errors/semester_not_found_error'
import { InvalidHierarchyError } from '#kernel/organisation/domain/errors/invalid_hierarchy_error'

export class CreateCourseHandler implements CommandHandler<CreateCourseCommand, string> {
  constructor(
    private readonly courses: CourseRepository,
    private readonly departments: DepartmentRepository,
    private readonly levels: LevelRepository,
    private readonly semesters: SemesterRepository
  ) {}

  async handle(command: CreateCourseCommand): Promise<string> {
    const department = await this.departments.findById(command.departmentId)

    if (!department) {
      throw new DepartmentNotFoundError()
    }

    const level = await this.levels.findById(command.levelId)

    if (!level) {
      throw new LevelNotFoundError()
    }

    if (level.getDepartmentId() !== command.departmentId) {
      throw new InvalidHierarchyError('Level does not belong to the given department')
    }

    const semester = await this.semesters.findById(command.semesterId)

    if (!semester) {
      throw new SemesterNotFoundError()
    }

    const id = (await this.courses.save(
      new Course(
        null,
        command.departmentId,
        command.levelId,
        command.semesterId,
        command.code,
        command.name,
        command.description,
        false,
        null,
        null
      )
    )) as string

    return id
  }
}
