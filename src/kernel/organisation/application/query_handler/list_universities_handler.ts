import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { ListUniversitiesQuery } from '#kernel/organisation/application/query/list_universities_query'
import { University } from '#kernel/organisation/domain/entity/university'
import { default as UniversityRecord } from '#database/active-records/university'
import { AppId } from '#shared/domain/app_id'

export class ListUniversitiesHandler implements QueryHandler<ListUniversitiesQuery, University[]> {
  async handle(query: ListUniversitiesQuery): Promise<University[]> {
    const records = await UniversityRecord.query().paginate(query.page, query.limit)
    return records.map(
      (record) =>
        new University(
          new AppId(record.id),
          record.name,
          record.slug,
          record.createdAt as any,
          record.updatedAt as any
        )
    )
  }
}
