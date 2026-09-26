import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'

export class CreateSemesterCommand implements Command {
  readonly timestamp: DateTime

  constructor(public readonly name: string) {
    this.timestamp = DateTime.now()
  }
}
