import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'
import { AppId } from '#shared/domain/app_id'
import { UserRole } from '#kernel/user/domain/types/user_role'

export class DeleteUploadCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly actorId: string,
    public readonly id: AppId,
    public readonly actorRole?: UserRole
  ) {
    this.timestamp = DateTime.now()
  }
}
