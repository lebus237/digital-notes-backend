import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { DeleteMediaCommand } from '#kernel/medias/application/command/delete_media_command'
import { MediaRepository } from '#kernel/medias/domain/media_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { MediaNotFoundError } from '#kernel/medias/domain/errors/media_not_found_error'
import { MediaNotOwnedError } from '#kernel/medias/domain/errors/media_not_owned_error'
import { UserRole } from '#kernel/user/domain/types/user_role'

export class DeleteMediaHandler implements CommandHandler<DeleteMediaCommand> {
  constructor(
    private readonly repository: MediaRepository,
    private readonly mediaManager: MediaManagerInterface
  ) {}
  async handle(command: DeleteMediaCommand): Promise<void> {
    const media = await this.repository.findById(command.id.value)

    if (!media) {
      throw new MediaNotFoundError(command.id.value)
    }

    const isAdmin = command.actorRole === UserRole.ADMINISTRATOR
    if (!isAdmin && !media.isOwnedBy(command.actorId)) {
      throw new MediaNotOwnedError()
    }

    if (await this.mediaManager.fileExists(media.getKey() as string)) {
      const isDeleted = await this.mediaManager.deleteFile(media.getKey() as string)

      isDeleted && (await this.repository.delete(command.id.value))
    }
  }
}
