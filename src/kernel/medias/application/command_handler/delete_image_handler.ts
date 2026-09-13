import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { DeleteImageCommand } from '#kernel/medias/application/command/delete_image_command'
import { ImageMediaRepository } from '#kernel/medias/domain/image_media_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { ImageNotFoundError } from '#kernel/medias/domain/errors/image_not_found_error'

export class DeleteImageHandler implements CommandHandler<DeleteImageCommand> {
  constructor(
    private readonly repository: ImageMediaRepository,
    private readonly mediaManager: MediaManagerInterface
  ) {}
  async handle(command: DeleteImageCommand): Promise<void> {
    const image = await this.repository.findById(command.id.value)

    if (!image) {
      throw new ImageNotFoundError(command.id.value)
    }

    if (await this.mediaManager.fileExists(image.getKey() as string)) {
      const isDeleted = await this.mediaManager.deleteFile(image.getKey() as string)

      isDeleted && (await this.repository.delete(command.id.value))
    }
  }
}
