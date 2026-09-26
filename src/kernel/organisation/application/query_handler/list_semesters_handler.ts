import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { ListSemestersQuery } from '#kernel/organisation/application/query/list_semesters_query'
import { Semester } from '#kernel/organisation/domain/entity/semester'
import { default as SemesterRecord } from '#database/active-records/semester'
import { AppId } from '#shared/domain/app_id'

export class ListSemestersHandler implements QueryHandler<ListSemestersQuery, Semester[]> {
  async handle(query: ListSemestersQuery): Promise<Semester[]> {
    const records = await SemesterRecord.query().paginate(query.page, query.limit)
    return records.map(
      (record) =>
        new Semester(new AppId(record.id), record.name, record.createdAt as any, record.updatedAt as any)
    )
  }
}
