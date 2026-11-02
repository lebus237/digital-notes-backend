import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'
import { AppId } from '#shared/domain/app_id'

export class UpdateSemesterCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly id: AppId,
    public readonly name?: string
  ) {
    this.timestamp = DateTime.now()
  }
}
