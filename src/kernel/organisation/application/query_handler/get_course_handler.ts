import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { GetCourseQuery } from '#kernel/organisation/application/query/get_course_query'
import { Course } from '#kernel/organisation/domain/entity/course'
import { CourseNotFoundError } from '#kernel/organisation/domain/errors/course_not_found_error'
import { default as CourseRecord } from '#database/active-records/course'
import { AppId } from '#shared/domain/app_id'

export class GetCourseHandler implements QueryHandler<GetCourseQuery, Course> {
  async handle(query: GetCourseQuery): Promise<Course> {
    const record = await CourseRecord.find(query.id)

    if (!record || record.isArchived) {
      throw new CourseNotFoundError()
    }

    return new Course(
      new AppId(record.id),
      String(record.departmentId),
      String(record.levelId),
      String(record.semesterId),
      record.code,
      record.name,
      record.description,
      record.isArchived,
      record.createdAt as any,
      record.updatedAt as any
    )
  }
}
