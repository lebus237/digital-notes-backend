import { DepartmentRecord } from '#database/active-records/index'
import {
  DepartmentData,
  DepartmentListItemData,
  DepartmentService,
} from '#kernel/organisation/application/services/department_service'
import { GetDepartmentCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_department_collection_query'
import { GetDepartmentQuery } from '#kernel/organisation/application/use-cases/query/get_department_query'
import { DepartmentNotFoundError } from '#kernel/organisation/domain/errors/department_not_found_error'
import { CollectionResponse } from '#shared/application/collection/collection_response'
import { mapPaginatedResult } from '#shared/infrastructure/collection/paginated_result'

export class DepartmentARService implements DepartmentService {
  async departmentCollection(
    query: GetDepartmentCollectionQuery
  ): Promise<CollectionResponse<DepartmentListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search

    const builder = DepartmentRecord.query()

    if (query.facultyId) {
      builder.where('faculty_id', query.facultyId.value)
    }

    if (q) {
      builder.whereILike('name', `%${q}%`)
    }

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<DepartmentRecord, DepartmentListItemData>(results, (item) => ({
      id: item.id,
      facultyId: item.facultyId,
      name: item.name,
      slug: item.slug,
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async viewDepartment(query: GetDepartmentQuery): Promise<DepartmentData> {
    const department = await DepartmentRecord.find(query.id.value)

    if (!department) {
      throw new DepartmentNotFoundError()
    }

    return {
      id: department.id,
      facultyId: department.facultyId,
      name: department.name,
      slug: department.slug,
      createdAt: department.createdAt.toISO()!,
      updatedAt: department.updatedAt.toISO()!,
    }
  }
}
