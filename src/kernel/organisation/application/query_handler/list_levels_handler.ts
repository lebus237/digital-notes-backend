import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { ListLevelsQuery } from '#kernel/organisation/application/query/list_levels_query'
import { Level } from '#kernel/organisation/domain/entity/level'
import { default as LevelRecord } from '#database/active-records/level'
import { AppId } from '#shared/domain/app_id'

export class ListLevelsHandler implements QueryHandler<ListLevelsQuery, Level[]> {
  async handle(query: ListLevelsQuery): Promise<Level[]> {
    const records = await LevelRecord.query()
      .where('department_id', query.departmentId)
      .paginate(query.page, query.limit)
    return records.map(
      (record) =>
        new Level(
          new AppId(record.id),
          String(record.departmentId),
          record.name,
          record.createdAt as any,
          record.updatedAt as any
        )
    )
  }
}
