import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { ListFacultiesQuery } from '#kernel/organisation/application/query/list_faculties_query'
import { Faculty } from '#kernel/organisation/domain/entity/faculty'
import { default as FacultyRecord } from '#database/active-records/faculty'
import { AppId } from '#shared/domain/app_id'

export class ListFacultiesHandler implements QueryHandler<ListFacultiesQuery, Faculty[]> {
  async handle(query: ListFacultiesQuery): Promise<Faculty[]> {
    const records = await FacultyRecord.query()
      .where('university_id', query.universityId)
      .paginate(query.page, query.limit)
    return records.map(
      (record) =>
        new Faculty(
          new AppId(record.id),
          String(record.universityId),
          record.name,
          record.slug,
          record.createdAt as any,
          record.updatedAt as any
        )
    )
  }
}
