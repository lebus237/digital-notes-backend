import { Query } from '#shared/application/use-cases/query'

export class ListCoursesQuery implements Query {
  readonly timestamp: Date

  constructor(
    public readonly filters: {
      departmentId?: string
      levelId?: string
      semesterId?: string
      search?: string
    } = {},
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {
    this.timestamp = new Date()
  }
}
