import { Query } from '#shared/application/use-cases/query'

export class GetNoteQuery implements Query {
  readonly timestamp: Date

  constructor(
    public readonly id: string,
    public readonly includeUnpublished: boolean = false
  ) {
    this.timestamp = new Date()
  }
}
