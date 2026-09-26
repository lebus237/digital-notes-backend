import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'

export class CreateCourseCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly departmentId: string,
    public readonly levelId: string,
    public readonly semesterId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly description: string | null = null
  ) {
    this.timestamp = DateTime.now()
  }
}
