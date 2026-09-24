import { CommandBus } from '#shared/infrastructure/bus/command_bus'
import { QueryBus } from '#shared/infrastructure/bus/query_bus'
import { ApplicationService } from '@adonisjs/core/types'
import { StoreUploadHandler } from '#kernel/uploads/application/command_handler/store_upload.handler'
import { DeleteUploadHandler } from '#kernel/uploads/application/command_handler/delete_upload_handler'

export default class CqrsProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    this.app.container.singleton('CQRS/CommandBus', () => {
      const commandBus = new CommandBus(this.app)

      //UPLOAD COMMANDS
      commandBus.register('StoreUploadCommand', StoreUploadHandler, [
        'UploadRepository',
        'MediaUploadService',
      ])
      commandBus.register('DeleteUploadCommand', DeleteUploadHandler, [
        'UploadRepository',
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
