import { CommandBus } from '#shared/infrastructure/bus/command_bus'
import { QueryBus } from '#shared/infrastructure/bus/query_bus'
import { ApplicationService } from '@adonisjs/core/types'
import { StoreImageHandler } from '#kernel/medias/application/command_handler/store_image.handler'
import { DeleteImageHandler } from '#kernel/medias/application/command_handler/delete_image_handler'
import { StoreDocumentHandler } from '#kernel/medias/application/command_handler/store_document.handler'
import { DeleteDocumentHandler } from '#kernel/medias/application/command_handler/delete_document_handler'
import { StoreMediaHandler } from '#kernel/medias/application/command_handler/store_media.handler'
import { DeleteMediaHandler } from '#kernel/medias/application/command_handler/delete_media_handler'

export default class CqrsProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    this.app.container.singleton('CQRS/CommandBus', () => {
      const commandBus = new CommandBus(this.app)

      //MEDIA COMMANDS
      commandBus.register('StoreImageCommand', StoreImageHandler, [
        'ImageMediaRepository',
        'MediaUploadService',
      ])
      commandBus.register('DeleteImageCommand', DeleteImageHandler, [
        'ImageMediaRepository',
        'MediaUploadService',
      ])
      commandBus.register('StoreDocumentCommand', StoreDocumentHandler, [
        'DocumentMediaRepository',
        'MediaUploadService',
      ])
      commandBus.register('DeleteDocumentCommand', DeleteDocumentHandler, [
        'DocumentMediaRepository',
        'MediaUploadService',
      ])
      commandBus.register('StoreMediaCommand', StoreMediaHandler, [
        'MediaRepository',
        'MediaUploadService',
      ])
      commandBus.register('DeleteMediaCommand', DeleteMediaHandler, [
        'MediaRepository',
        'MediaUploadService',
      ])

      return commandBus
    })

    this.app.container.singleton('CQRS/QueryBus', () => {
      const queryBus = new QueryBus(this.app)

      return queryBus
    })
  }

  public async boot() {}
  public async ready() {}
  public async shutdown() {}
}
