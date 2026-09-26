import { Query } from '#shared/application/use-cases/query'
import { DateTime } from 'luxon'

export class ListLevelsQuery implements Query {
  readonly timestamp: DateTime

  constructor(
    public readonly departmentId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {
    this.timestamp = DateTime.now()
  }
}
