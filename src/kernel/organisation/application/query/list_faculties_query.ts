import { Query } from '#shared/application/use-cases/query'

export class ListFacultiesQuery implements Query {
  readonly timestamp: Date

  constructor(
    public readonly universityId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {
    this.timestamp = new Date()
  }
}
