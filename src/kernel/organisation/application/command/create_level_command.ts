import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'

export class CreateLevelCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly departmentId: string,
    public readonly name: string
  ) {
    this.timestamp = DateTime.now()
  }
}
