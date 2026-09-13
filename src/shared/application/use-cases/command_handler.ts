import { Command } from '#shared/application/use-cases/command'

export interface CommandHandler<TCommand extends Command, TResult = void> {
  handle(command: TCommand): Promise<TResult>
}
