import { Query } from '#shared/application/use-cases/query'
import { DateTime } from 'luxon'

export class GetCourseQuery implements Query {
  readonly timestamp: DateTime

  constructor(public readonly id: string) {
    this.timestamp = DateTime.now()
  }
}
