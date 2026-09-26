import { Query } from '#shared/application/use-cases/query'
import { AppId } from '#shared/domain/app_id'
import { DateTime } from 'luxon'

export class GetNoteDetailQuery implements Query {
  readonly timestamp: DateTime

  constructor(
    public readonly id: AppId,
    public readonly includeUnpublished: boolean = false
  ) {
    this.timestamp = DateTime.now()
  }
}
