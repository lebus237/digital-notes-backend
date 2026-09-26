import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'
import { AppId } from '#shared/domain/app_id'

export class UpdateNoteMetadataCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly id: AppId,
    public readonly title: string,
    public readonly description: string | null,
    public readonly price: number
  ) {
    this.timestamp = DateTime.now()
  }
}
