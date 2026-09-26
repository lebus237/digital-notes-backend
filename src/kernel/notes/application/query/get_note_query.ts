import { Query } from '#shared/application/use-cases/query'
import { DateTime } from 'luxon'

export class GetNoteQuery implements Query {
  readonly timestamp: DateTime

  constructor(
    public readonly id: string,
    public readonly includeUnpublished: boolean = false
  ) {
    this.timestamp = DateTime.now()
  }
}
