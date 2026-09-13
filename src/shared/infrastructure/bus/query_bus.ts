import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { Query } from '#shared/application/use-cases/query'
import { ApplicationService, ContainerBindings } from '@adonisjs/core/types'
import { HandlerNotRegisteredError } from '#shared/infrastructure/bus/errors/handler_not_registered_error'

export class QueryBus {
  private handlers: Map<
    string,
    {
      handler: new (...args: any[]) => QueryHandler<any, any>
      deps: Array<keyof ContainerBindings>
    }
  > = new Map()

  constructor(private app: ApplicationService) {}

  register<TQuery extends Query, TResult>(
    queryName: string,
    handler: new (...args: any[]) => QueryHandler<TQuery, TResult>,
    injectables?: Array<keyof ContainerBindings>
  ): void {
    this.handlers.set(queryName, { handler, deps: injectables || [] })
  }

  async execute<TQuery extends Query, TResult>(query: TQuery): Promise<TResult> {
    const queryName = query.constructor.name
    const registration = this.handlers.get(queryName)

    if (!registration) {
      throw new HandlerNotRegisteredError('query', queryName)
    }

    // Create handler instance with fresh dependencies per execution
    const deps = await Promise.all(
      registration.deps.map((dep) => this.app.container.make(dep as string))
    )
    const handlerInstance = new registration.handler(...deps)

    return handlerInstance.handle(query)
  }
}
