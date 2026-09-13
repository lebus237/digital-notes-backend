import { DocumentMediaRepository } from '#kernel/medias/domain/document_media_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { CommandHandler } from '#shared/application/use-cases/command_handler'
import {
  StoreDocumentCommand,
  StoreDocumentCommandReturnType,
} from '#kernel/medias/application/command/store_document_command'
import { DocumentMedia } from '#kernel/medias/domain/document_media'

export class StoreDocumentHandler implements CommandHandler<
  StoreDocumentCommand,
  StoreDocumentCommandReturnType
> {
  constructor(
    private repository: DocumentMediaRepository,
    private uploadService: MediaManagerInterface
  ) {}

  async handle(command: StoreDocumentCommand): Promise<StoreDocumentCommandReturnType> {
    const upload = await this.uploadService.uploadDocument(
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
      new DocumentMedia(
        null,
        command.title,
        upload.url as string,
        command.description,
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
