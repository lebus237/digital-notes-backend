import { UploadRepository } from '#kernel/uploads/domain/upload_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { CommandHandler } from '#shared/application/use-cases/command_handler'
import {
  StoreUploadCommand,
  StoreUploadCommandReturnType,
} from '#kernel/uploads/application/command/store_upload_command'
import { Upload } from '#kernel/uploads/domain/upload'
import { MediaType } from '#shared/application/services/upload/types'
import { ApplicationError } from '#shared/application/errors/application_error'

export class StoreUploadHandler implements CommandHandler<
  StoreUploadCommand,
  StoreUploadCommandReturnType
> {
  constructor(
    private repository: UploadRepository,
    private uploadService: MediaManagerInterface
  ) {}

  async handle(command: StoreUploadCommand): Promise<StoreUploadCommandReturnType> {
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
      throw new ApplicationError('MEDIA_UPLOAD_FAILED', 'Upload failed', {
        reason: upload.error,
      })
    }

    const type = this.uploadService.getMediaType(command.file.mimeType) as MediaType

    const id = (await this.repository.save(
      new Upload(
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
        upload.key,
        command.actorId
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
