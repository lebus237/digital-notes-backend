import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { DeleteDocumentCommand } from '#kernel/medias/application/command/delete_document_command'
import { DocumentMediaRepository } from '#kernel/medias/domain/document_media_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { DocumentNotFoundError } from '#kernel/medias/domain/errors/document_not_found_error'

export class DeleteDocumentHandler implements CommandHandler<DeleteDocumentCommand> {
  constructor(
    private readonly repository: DocumentMediaRepository,
    private readonly mediaManager: MediaManagerInterface
  ) {}
  async handle(command: DeleteDocumentCommand): Promise<void> {
    const document = await this.repository.findById(command.id.value)

    if (!document) {
      throw new DocumentNotFoundError(command.id.value)
    }

    if (await this.mediaManager.fileExists(document.getKey() as string)) {
      const isDeleted = await this.mediaManager.deleteFile(document.getKey() as string)

      isDeleted && (await this.repository.delete(command.id.value))
    }
  }
}
