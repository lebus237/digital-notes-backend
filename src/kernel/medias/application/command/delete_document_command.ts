import { Command } from '#shared/application/use-cases/command'
import { AppId } from '#shared/domain/app_id'
import { UserRole } from '#kernel/user/domain/types/user_role'

export class DeleteDocumentCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly actorId: string,
    public readonly id: AppId,
    public readonly actorRole?: UserRole
  ) {
    this.timestamp = new Date()
  }
}
