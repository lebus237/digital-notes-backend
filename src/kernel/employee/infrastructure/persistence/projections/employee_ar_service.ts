import { EmployeeRecord } from '#database/active-records/index'
import {
  EmployeeData,
  EmployeeListItemData,
  EmployeeService,
} from '#kernel/employee/application/services/employee_service'
import { GetEmployeeCollectionQuery } from '#kernel/employee/application/use-cases/query/get_employee_collection_query'
import { GetEmployeeQuery } from '#kernel/employee/application/use-cases/query/get_employee_query'
import { EmployeeNotFoundError } from '#kernel/employee/domain/errors/employee_not_found_error'
import { CollectionResponse } from '#shared/application/collection/collection_response'
import { mapPaginatedResult } from '#shared/infrastructure/collection/paginated_result'

export class EmployeeARService implements EmployeeService {
  async employeeCollection(
    query: GetEmployeeCollectionQuery
  ): Promise<CollectionResponse<EmployeeListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search

    const builder = EmployeeRecord.query().preload('user').preload('university')

    if (query.universityId) {
      builder.where('university_id', query.universityId.value)
    }

    if (q) {
      builder.whereHas('user', (userQuery) => {
        userQuery.whereILike('full_name', `%${q}%`).orWhereILike('email', `%${q}%`)
      })
    }

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<EmployeeRecord, EmployeeListItemData>(results, (item) => ({
      id: item.id,
      universityName: item.university?.name ?? '',
      fullName: item.user?.fullName ?? null,
      email: item.user?.email ?? '',
      phoneNumber: item.user?.phoneNumber ?? '',
      role: item.user?.role,
      createdAt: String(item.createdAt),
      updatedAt: String(item.updatedAt),
    }))
  }

  async viewEmployee(query: GetEmployeeQuery): Promise<EmployeeData> {
    const record = await EmployeeRecord.query()
      .where('id', query.id.value)
      .preload('user')
      .preload('university')
      .first()

    if (!record) {
      throw new EmployeeNotFoundError()
    }

    return {
      id: record.id,
      universityId: String(record.universityId),
      userId: String(record.userId),
      universityName: record.university?.name ?? '',
      fullName: record.user?.fullName ?? null,
      email: record.user?.email ?? '',
      phoneNumber: record.user?.phoneNumber ?? '',
      role: record.user?.role,
      createdAt: record.createdAt.toISO()!,
      updatedAt: record.updatedAt.toISO()!,
    }
  }
}
