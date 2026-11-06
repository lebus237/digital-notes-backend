import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'
import { AppId } from '#shared/domain/app_id'
import { UserRole } from '#kernel/user/domain/types/user_role'

export class SubmitNoteCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly id: AppId,
    public readonly actorId: AppId,
    public readonly actorRole: UserRole
  ) {
    this.timestamp = DateTime.now()
  }
}
