import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { ListDepartmentsQuery } from '#kernel/organisation/application/query/list_departments_query'
import { Department } from '#kernel/organisation/domain/entity/department'
import { default as DepartmentRecord } from '#database/active-records/department'
import { AppId } from '#shared/domain/app_id'

export class ListDepartmentsHandler implements QueryHandler<ListDepartmentsQuery, Department[]> {
  async handle(query: ListDepartmentsQuery): Promise<Department[]> {
    const records = await DepartmentRecord.query()
      .where('faculty_id', query.facultyId)
      .paginate(query.page, query.limit)
    return records.map(
      (record) =>
        new Department(
          new AppId(record.id),
          String(record.facultyId),
          record.name,
          record.slug,
          record.createdAt as any,
          record.updatedAt as any
        )
    )
  }
}
