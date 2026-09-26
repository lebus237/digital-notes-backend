import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'

export class CreateFacultyCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly universityId: string,
    public readonly name: string,
    public readonly slug: string
  ) {
    this.timestamp = DateTime.now()
  }
}
