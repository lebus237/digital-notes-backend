import { MediaRepository } from '#kernel/medias/domain/media_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { CommandHandler } from '#shared/application/use-cases/command_handler'
import {
  StoreMediaCommand,
  StoreMediaCommandReturnType,
} from '#kernel/medias/application/command/store_media_command'
import { Media } from '#kernel/medias/domain/media'
import { MediaType } from '#shared/application/services/upload/types'

export class StoreMediaHandler implements CommandHandler<
  StoreMediaCommand,
  StoreMediaCommandReturnType
> {
  constructor(
    private repository: MediaRepository,
    private uploadService: MediaManagerInterface
  ) {}

  async handle(command: StoreMediaCommand): Promise<StoreMediaCommandReturnType> {
    const upload = await this.uploadService.uploadFile(
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

    const type = this.uploadService.getMediaType(command.file.mimeType) as MediaType

    const id = (await this.repository.save(
      new Media(
        null,
        type,
        command.title,
        upload.url as string,
        command.description,
        command.file.mimeType,
        command.file.size,
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
      type,
    }
  }
}
