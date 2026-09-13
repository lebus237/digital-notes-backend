import { ApplicationService, ContainerBindings } from '@adonisjs/core/types'
import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { HandlerNotRegisteredError } from '#shared/infrastructure/bus/errors/handler_not_registered_error'

type HandlerConstructor = new (...args: any[]) => CommandHandler<any, any> | QueryHandler<any, any>

interface HandlerRegistration {
  handler: HandlerConstructor
  deps: Array<keyof ContainerBindings>
}

export class CQRSRegistry {
  private commandHandlers: Map<string, HandlerRegistration> = new Map()
  private queryHandlers: Map<string, HandlerRegistration> = new Map()

  constructor(private app: ApplicationService) {}

  /**
   * Register a command handler with its dependencies
   */
  registerCommand(
    commandName: string,
    handler: HandlerConstructor,
    deps: Array<keyof ContainerBindings> = []
  ): void {
    this.commandHandlers.set(commandName, { handler, deps })
  }

  /**
   * Register a query handler with its dependencies
   */
  registerQuery(
    queryName: string,
    handler: HandlerConstructor,
    deps: Array<keyof ContainerBindings> = []
  ): void {
    this.queryHandlers.set(queryName, { handler, deps })
  }

  /**
   * Auto-register by convention: CreateOrderCommand -> CreateOrderHandler
   */
  registerByConvention(
    commandOrQueryName: string,
    handler: HandlerConstructor,
    deps: Array<keyof ContainerBindings>
  ): void {
    if (commandOrQueryName.endsWith('Command')) {
      this.registerCommand(commandOrQueryName, handler, deps)
    } else if (commandOrQueryName.endsWith('Query')) {
      this.registerQuery(commandOrQueryName, handler, deps)
    } else {
      throw new Error(`Cannot determine if "${commandOrQueryName}" is a Command or Query`)
    }
  }

  /**
   * Resolve a command handler instance with dependencies injected
   */
  async resolveCommandHandler(commandName: string): Promise<CommandHandler<any, any>> {
    const registration = this.commandHandlers.get(commandName)
    if (!registration) {
      throw new HandlerNotRegisteredError('command', commandName)
    }
    return this.createHandlerInstance(registration)
  }

  /**
   * Resolve a query handler instance with dependencies injected
   */
  async resolveQueryHandler(queryName: string): Promise<QueryHandler<any, any>> {
    const registration = this.queryHandlers.get(queryName)
    if (!registration) {
      throw new HandlerNotRegisteredError('query', queryName)
    }
    return this.createHandlerInstance(registration)
  }

  private async createHandlerInstance(registration: HandlerRegistration): Promise<any> {
    const deps = await Promise.all(
      registration.deps.map((dep) => this.app.container.make(dep as string))
    )
    return new registration.handler(...deps)
  }
}
