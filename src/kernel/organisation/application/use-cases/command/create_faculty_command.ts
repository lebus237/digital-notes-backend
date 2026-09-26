import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'
import { AppId } from '#shared/domain/app_id'

export class CreateFacultyCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly universityId: AppId,
    public readonly name: string,
    public readonly slug: string
  ) {
    this.timestamp = DateTime.now()
  }
}
