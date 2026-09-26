import { Command } from '#shared/application/use-cases/command'

export class CreateSemesterCommand implements Command {
  readonly timestamp: Date

  constructor(public readonly name: string) {
    this.timestamp = new Date()
  }
}
