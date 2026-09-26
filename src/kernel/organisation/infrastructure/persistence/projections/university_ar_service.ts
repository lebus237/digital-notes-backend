import { UniversityRecord } from '#database/active-records/index'
import {
  UniversityData,
  UniversityListItemData,
  UniversityService,
} from '#kernel/organisation/application/services/university_service'
import { GetUniversityCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_university_collection_query'
import { GetUniversityQuery } from '#kernel/organisation/application/use-cases/query/get_university_query'
import { UniversityNotFoundError } from '#kernel/organisation/domain/errors/university_not_found_error'
import { CollectionResponse } from '#shared/application/collection/collection_response'
import { mapPaginatedResult } from '#shared/infrastructure/collection/paginated_result'

export class UniversityARService implements UniversityService {
  async universityCollection(
    query: GetUniversityCollectionQuery
  ): Promise<CollectionResponse<UniversityListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search

    const builder = UniversityRecord.query()

    if (q) {
      builder.whereILike('name', `%${q}%`)
    }

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<UniversityRecord, UniversityListItemData>(results, (item) => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async viewUniversity(query: GetUniversityQuery): Promise<UniversityData> {
    const record = await UniversityRecord.find(query.id.value)

    if (!record) {
      throw new UniversityNotFoundError()
    }

    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
      createdAt: record.createdAt.toISO()!,
      updatedAt: record.updatedAt.toISO()!,
    }
  }
}
