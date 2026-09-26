import { LevelRecord } from '#database/active-records/index'
import {
  LevelData,
  LevelListItemData,
  LevelService,
} from '#kernel/organisation/application/services/level_service'
import { GetLevelCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_level_collection_query'
import { GetLevelQuery } from '#kernel/organisation/application/use-cases/query/get_level_query'
import { LevelNotFoundError } from '#kernel/organisation/domain/errors/level_not_found_error'
import { CollectionResponse } from '#shared/application/collection/collection_response'
import { mapPaginatedResult } from '#shared/infrastructure/collection/paginated_result'

export class LevelARService implements LevelService {
  async levelCollection(
    query: GetLevelCollectionQuery
  ): Promise<CollectionResponse<LevelListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search

    const builder = LevelRecord.query()

    if (query.departmentId) {
      builder.where('department_id', query.departmentId.value)
    }

    if (q) {
      builder.whereILike('name', `%${q}%`)
    }

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<LevelRecord, LevelListItemData>(results, (item) => ({
      id: item.id,
      departmentId: item.departmentId,
      name: item.name,
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async viewLevel(query: GetLevelQuery): Promise<LevelData> {
    const level = await LevelRecord.find(query.id.value)

    if (!level) {
      throw new LevelNotFoundError()
    }

    return {
      id: level.id,
      departmentId: level.departmentId,
      name: level.name,
      createdAt: level.createdAt.toISO()!,
      updatedAt: level.updatedAt.toISO()!,
    }
  }
}
