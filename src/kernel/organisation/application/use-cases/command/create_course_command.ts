import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'
import { AppId } from '#shared/domain/app_id'

export class CreateCourseCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly departmentId: AppId,
    public readonly levelId: AppId,
    public readonly semesterId: AppId,
    public readonly code: string,
    public readonly name: string,
    public readonly description: string | null = null
  ) {
    this.timestamp = DateTime.now()
  }
}
