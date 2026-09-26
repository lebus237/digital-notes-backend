import { Command } from '#shared/application/use-cases/command'
import app from '@adonisjs/core/services/app'
import { Query } from '#shared/application/use-cases/query'
import { ContainerBindings } from '@adonisjs/core/types'
import { Search } from '#shared/application/read-model/search'
import { Pagination } from '#shared/application/read-model/pagination'
import _ from 'lodash'
import { Order, SortDirection } from '#shared/application/read-model/order'
import { DateTimeUtils } from '#lib/date_time'
import { DateRange } from '#shared/application/read-model/date_range'

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

  //Query resolver

  protected getQuerySearch(query: Record<string, any>) {
    return new Search(query.q || query.search)
  }

  protected getQueryPagination(query: Record<string, any>) {
    const page = query.page || query['page[offset]']
    const limit = query.limit || query['page[limit]']

    return new Pagination(page, limit)
  }

  protected getQuerySort(query: Record<string, any>) {
    return new Order(query['sort'] as Record<string, SortDirection>)
  }

  protected getQueryDateRange(query: Record<string, any>) {
    const fromDate = DateTimeUtils.parseISODateOrNull(query['fromDate'])
    const toDate = DateTimeUtils.parseISODateOrNull(query['toDate'])

    return new DateRange(fromDate, toDate)
  }
}
