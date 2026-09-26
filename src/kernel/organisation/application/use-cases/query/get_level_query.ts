import { Query } from '#shared/application/use-cases/query'
import { AppId } from '#shared/domain/app_id'
import { DateTime } from 'luxon'

export class GetLevelQuery implements Query {
  readonly timestamp: DateTime

  constructor(public readonly id: AppId) {
    this.timestamp = DateTime.now()
  }
}
