import { Command } from '#shared/application/use-cases/command'
import app from '@adonisjs/core/services/app'
import { Query } from '#shared/application/use-cases/query'
import { ContainerBindings } from '@adonisjs/core/types'
import { QuerySearch } from '#shared/application/query-options/query_search'
import { Pagination } from '#shared/application/query-options/pagination'
import _ from 'lodash'
import { Sort, SortDirection } from '#shared/application/query-options/sort'

export class AppAbstractController {
  protected async handleCommand<ReturnType>(command: Command) {
    const bus = await app.container.make('CQRS/CommandBus')

    return await bus.execute<Command, ReturnType>(command)
  }

  protected async handleQuery<TResult>(query: Query): Promise<TResult> {
    const bus = await app.container.make('CQRS/QueryBus')

    return await bus.execute<Query, TResult>(query)
  }

  protected async getService(service: keyof ContainerBindings) {
    return await app.container.make(service)
  }

  protected parseQuerySearch(query: Record<string, any>) {
    return new QuerySearch(query.q || query.search)
  }

  protected parseQueryPagination(query: Record<string, any>) {
    const page = query.page || query['page[offset]']
    const limit = query.limit || query['page[limit]']

    return new Pagination(page, limit)
  }

  protected parseQuerySort(query: Record<string, any>) {
    return new Sort(query['sort'] as Record<string, SortDirection>)
  }
}
