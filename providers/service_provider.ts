import { MediaUploadService } from '#core/application/services/media-upload/media_upload_service'
import { StorageProviderFactory } from '#infra/factory/storage_provider.factory'
import { ApplicationService } from '@adonisjs/core/types'

export default class RepositoryProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    if (this.app.nodeEnvironment !== 'test') {
      this.app.container.bind('MediaUploadService', () => {
        const provider = StorageProviderFactory.createFromEnv()
        return new MediaUploadService(provider)
      })
    }
  }

  public async boot() {}
  public async ready() {}
  public async shutdown() {}
}
