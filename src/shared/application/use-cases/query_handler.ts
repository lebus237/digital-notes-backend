import { Query } from '#shared/application/use-cases/query'

export interface QueryHandler<TQuery extends Query, TResult> {
  handle(command: TQuery): Promise<TResult>
}
