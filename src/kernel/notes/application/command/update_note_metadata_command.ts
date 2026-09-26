import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'

export class UpdateNoteMetadataCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly price: number
  ) {
    this.timestamp = DateTime.now()
  }
}
