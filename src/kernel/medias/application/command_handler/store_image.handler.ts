import { ImageMediaRepository } from '#kernel/medias/domain/image_media_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { CommandHandler } from '#shared/application/use-cases/command_handler'
import {
  StoreImageCommand,
  StoreImageCommandReturnType,
} from '#kernel/medias/application/command/store_image_command'
import { ImageMedia } from '#kernel/medias/domain/image_media'

export class StoreImageHandler implements CommandHandler<
  StoreImageCommand,
  StoreImageCommandReturnType
> {
  constructor(
    private repository: ImageMediaRepository,
    private uploadService: MediaManagerInterface
  ) {}

  async handle(command: StoreImageCommand): Promise<StoreImageCommandReturnType> {
    const upload = await this.uploadService.uploadImage(
      {
        buffer: await command.file.getBuffer(),
        originalName: command.file.originalName,
        mimeType: command.file.mimeType,
        size: command.file.size,
      },
      command.file.getFile()
    )

    if (!upload.success) {
      throw new Error(`${upload.error}`)
    }

    const id = (await this.repository.save(
      new ImageMedia(
        null,
        command.title,
        upload.url as string,
        command.altDescription,
        upload.metadata,
        null,
        null,
        upload.key
      )
    )) as string

    return {
      id,
      url: upload.url as string,
      signedUrl: await this.uploadService.getSignedUrl(upload.key as string),
    }
  }
}
