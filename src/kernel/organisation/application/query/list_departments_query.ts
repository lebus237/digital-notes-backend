import { Query } from '#shared/application/use-cases/query'

export class ListDepartmentsQuery implements Query {
  readonly timestamp: Date

  constructor(
    public readonly facultyId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {
    this.timestamp = new Date()
  }
}
