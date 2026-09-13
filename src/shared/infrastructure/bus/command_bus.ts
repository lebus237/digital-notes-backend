import { Command } from '#shared/application/use-cases/command'
import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { ApplicationService, ContainerBindings } from '@adonisjs/core/types'
import { HandlerNotRegisteredError } from '#shared/infrastructure/bus/errors/handler_not_registered_error'

export class CommandBus {
  private handlers: Map<
    string,
    {
      handler: new (...args: any[]) => CommandHandler<any, any>
      deps: Array<keyof ContainerBindings>
    }
  > = new Map()

  constructor(private app: ApplicationService) {}

  register<TCommand extends Command, TResult = void>(
    commandName: string,
    handler: new (...args: any[]) => CommandHandler<TCommand, TResult>,
    injectables?: Array<keyof ContainerBindings>
  ): void {
    this.handlers.set(commandName, { handler, deps: injectables || [] })
  }

  async execute<TCommand extends Command, TResult = void>(command: TCommand): Promise<TResult> {
    const commandName = command.constructor.name
    const registration = this.handlers.get(commandName)

    if (!registration) {
      throw new HandlerNotRegisteredError('command', commandName)
    }

    // Create handler instance with fresh dependencies per execution
    const deps = await Promise.all(
      registration.deps.map((dep) => this.app.container.make(dep as string))
    )
    const handlerInstance = new registration.handler(...deps)

    return await handlerInstance.handle(command)
  }
}
