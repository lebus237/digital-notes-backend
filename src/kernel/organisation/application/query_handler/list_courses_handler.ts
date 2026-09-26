import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { ListCoursesQuery } from '#kernel/organisation/application/query/list_courses_query'
import { Course } from '#kernel/organisation/domain/entity/course'
import { default as CourseRecord } from '#database/active-records/course'
import { AppId } from '#shared/domain/app_id'

export class ListCoursesHandler implements QueryHandler<ListCoursesQuery, Course[]> {
  async handle(query: ListCoursesQuery): Promise<Course[]> {
    const builder = CourseRecord.query().where('is_archived', false)

    if (query.filters.departmentId) {
      builder.where('department_id', query.filters.departmentId)
    }

    if (query.filters.levelId) {
      builder.where('level_id', query.filters.levelId)
    }

    if (query.filters.semesterId) {
      builder.where('semester_id', query.filters.semesterId)
    }

    if (query.filters.search) {
      builder.where((scoped) => {
        scoped.whereILike('name', `%${query.filters.search}%`).orWhereILike('code', `%${query.filters.search}%`)
      })
    }

    const records = await builder.paginate(query.page, query.limit)
    return records.map(
      (record) =>
        new Course(
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
    )
  }
}
