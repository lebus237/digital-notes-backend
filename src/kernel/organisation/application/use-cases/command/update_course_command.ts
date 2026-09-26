import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'

export class UpdateCourseCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly id: string,
    public readonly code?: string,
    public readonly name?: string,
    public readonly description?: string | null
  ) {
    this.timestamp = DateTime.now()
  }
}
