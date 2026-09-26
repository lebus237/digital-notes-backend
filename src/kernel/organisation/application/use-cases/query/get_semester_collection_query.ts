import { Pagination } from '#shared/application/read-model/pagination'
import { Search } from '#shared/application/read-model/search'
import { Query } from '#shared/application/use-cases/query'
import { DateTime } from 'luxon'

export class GetSemesterCollectionQuery implements Query {
  readonly timestamp: DateTime

  constructor(
    public readonly pagination: Pagination,
    public readonly search: Search
  ) {
    this.timestamp = DateTime.now()
  }
}
