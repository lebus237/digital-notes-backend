import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'

export class ArchiveCourseCommand implements Command {
  readonly timestamp: DateTime

  constructor(public readonly id: string) {
    this.timestamp = DateTime.now()
  }
}
