import { CourseRecord } from '#database/active-records/index'
import {
  CourseData,
  CourseListItemData,
  CourseService,
} from '#kernel/organisation/application/services/course_service'
import { GetCourseCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_course_collection_query'
import { GetCourseDetailQuery } from '#kernel/organisation/application/use-cases/query/get_course_detail_query'
import { CourseNotFoundError } from '#kernel/organisation/domain/errors/course_not_found_error'
import { CollectionResponse } from '#shared/application/collection/collection_response'
import { mapPaginatedResult } from '#shared/infrastructure/collection/paginated_result'

export class CourseARService implements CourseService {
  async courseCollection(
    query: GetCourseCollectionQuery
  ): Promise<CollectionResponse<CourseListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search

    const builder = CourseRecord.query().where('is_archived', false)

    if (query.departmentId) {
      builder.where('department_id', query.departmentId.value)
    }

    if (query.levelId) {
      builder.where('level_id', query.levelId.value)
    }

    if (query.semesterId) {
      builder.where('semester_id', query.semesterId.value)
    }

    if (q) {
      builder.where((scoped) => {
        scoped.whereILike('name', `%${q}%`).orWhereILike('code', `%${q}%`)
      })
    }

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<CourseRecord, CourseListItemData>(results, (item) => ({
      id: item.id,
      departmentId: item.departmentId,
      levelId: item.levelId,
      semesterId: item.semesterId,
      code: item.code,
      name: item.name,
      description: item.description,
      isArchived: item.isArchived,
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async viewCourse(query: GetCourseDetailQuery): Promise<CourseData> {
    const course = await CourseRecord.find(query.id.value)

    if (!course || course.isArchived) {
      throw new CourseNotFoundError()
    }

    return {
      id: course.id,
      departmentId: course.departmentId,
      levelId: course.levelId,
      semesterId: course.semesterId,
      code: course.code,
      name: course.name,
      description: course.description,
      isArchived: course.isArchived,
      createdAt: course.createdAt.toISO()!,
      updatedAt: course.updatedAt.toISO()!,
    }
  }
}
