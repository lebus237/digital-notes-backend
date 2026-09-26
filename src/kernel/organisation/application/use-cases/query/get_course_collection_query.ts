import { Pagination } from '#shared/application/read-model/pagination'
import { Search } from '#shared/application/read-model/search'
import { AppId } from '#shared/domain/app_id'
import { Query } from '#shared/application/use-cases/query'
import { DateTime } from 'luxon'

export class GetCourseCollectionQuery implements Query {
  readonly timestamp: DateTime

  constructor(
    public readonly departmentId: AppId | null,
    public readonly levelId: AppId | null,
    public readonly semesterId: AppId | null,
    public readonly pagination: Pagination,
    public readonly search: Search
  ) {
    this.timestamp = DateTime.now()
  }
}
