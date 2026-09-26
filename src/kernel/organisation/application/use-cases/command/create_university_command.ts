import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'

export class CreateUniversityCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly name: string,
    public readonly slug: string
  ) {
    this.timestamp = DateTime.now()
  }
}
