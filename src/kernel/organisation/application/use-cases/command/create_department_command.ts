import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'

export class CreateDepartmentCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly facultyId: string,
    public readonly name: string,
    public readonly slug: string
  ) {
    this.timestamp = DateTime.now()
  }
}
