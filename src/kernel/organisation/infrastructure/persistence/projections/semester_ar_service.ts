import { SemesterRecord } from '#database/active-records/index'
import {
  SemesterData,
  SemesterListItemData,
  SemesterService,
} from '#kernel/organisation/application/services/semester_service'
import { GetSemesterCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_semester_collection_query'
import { GetSemesterQuery } from '#kernel/organisation/application/use-cases/query/get_semester_query'
import { SemesterNotFoundError } from '#kernel/organisation/domain/errors/semester_not_found_error'
import { CollectionResponse } from '#shared/application/collection/collection_response'
import { mapPaginatedResult } from '#shared/infrastructure/collection/paginated_result'

export class SemesterARService implements SemesterService {
  async semesterCollection(
    query: GetSemesterCollectionQuery
  ): Promise<CollectionResponse<SemesterListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search

    const builder = SemesterRecord.query()

    if (q) {
      builder.whereILike('name', `%${q}%`)
    }

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<SemesterRecord, SemesterListItemData>(results, (item) => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async viewSemester(query: GetSemesterQuery): Promise<SemesterData> {
    const semester = await SemesterRecord.find(query.id.value)

    if (!semester) {
      throw new SemesterNotFoundError()
    }

    return {
      id: semester.id,
      name: semester.name,
      createdAt: semester.createdAt.toISO()!,
      updatedAt: semester.updatedAt.toISO()!,
    }
  }
}
