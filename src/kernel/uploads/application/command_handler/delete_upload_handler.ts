import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { DeleteUploadCommand } from '#kernel/uploads/application/command/delete_upload_command'
import { UploadRepository } from '#kernel/uploads/domain/upload_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { UploadNotFoundError } from '#kernel/uploads/domain/errors/upload_not_found_error'
import { UploadNotOwnedError } from '#kernel/uploads/domain/errors/upload_not_owned_error'
import { UserRole } from '#kernel/user/domain/types/user_role'

export class DeleteUploadHandler implements CommandHandler<DeleteUploadCommand> {
  constructor(
    private readonly repository: UploadRepository,
    private readonly mediaManager: MediaManagerInterface
  ) {}
  async handle(command: DeleteUploadCommand): Promise<void> {
    const upload = await this.repository.findById(command.id.value)

    if (!upload) {
      throw new UploadNotFoundError(command.id.value)
    }

    const isAdmin = command.actorRole === UserRole.ADMINISTRATOR
    if (!isAdmin && !upload.isOwnedBy(command.actorId)) {
      throw new UploadNotOwnedError()
    }

    if (await this.mediaManager.fileExists(upload.getKey() as string)) {
      const isDeleted = await this.mediaManager.deleteFile(upload.getKey() as string)

      isDeleted && (await this.repository.delete(command.id.value))
    }
  }
}
