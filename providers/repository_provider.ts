import { ApplicationService } from '@adonisjs/core/types'
import { ImageMediaARRepository } from '#kernel/medias/infrastructure/persistence/image_media_ar_repository'
import { DocumentMediaARRepository } from '#kernel/medias/infrastructure/persistence/document_media_ar_repository'

export default class RepositoryProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    if (this.app.nodeEnvironment !== 'test') {
      this.app.container.bind('ImageMediaRepository', () => {
        return new ImageMediaARRepository()
      })
      this.app.container.bind('DocumentMediaRepository', () => {
        return new DocumentMediaARRepository()
      })
    }
  }

  public async boot() {}
  public async ready() {}
  public async shutdown() {}
}
