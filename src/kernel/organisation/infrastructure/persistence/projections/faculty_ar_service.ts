import { FacultyRecord } from '#database/active-records/index'
import {
  FacultyData,
  FacultyListItemData,
  FacultyService,
} from '#kernel/organisation/application/services/faculty_service'
import { GetFacultyCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_faculty_collection_query'
import { GetFacultyQuery } from '#kernel/organisation/application/use-cases/query/get_faculty_query'
import { FacultyNotFoundError } from '#kernel/organisation/domain/errors/faculty_not_found_error'
import { CollectionResponse } from '#shared/application/collection/collection_response'
import { mapPaginatedResult } from '#shared/infrastructure/collection/paginated_result'

export class FacultyARService implements FacultyService {
  async facultyCollection(
    query: GetFacultyCollectionQuery
  ): Promise<CollectionResponse<FacultyListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search

    const builder = FacultyRecord.query()

    if (query.universityId) {
      builder.where('university_id', query.universityId.value)
    }

    if (q) {
      builder.whereILike('name', `%${q}%`)
    }

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<FacultyRecord, FacultyListItemData>(results, (item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async viewFaculty(query: GetFacultyQuery): Promise<FacultyData> {
    const faculty = await FacultyRecord.find(query.id.value)

    if (!faculty) {
      throw new FacultyNotFoundError()
    }

    return {
      id: faculty.id,
      universityId: faculty.universityId,
      name: faculty.name,
      slug: faculty.slug,
      createdAt: faculty.createdAt.toISO()!,
      updatedAt: faculty.updatedAt.toISO()!,
    }
  }
}
