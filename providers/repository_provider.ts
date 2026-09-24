import { ApplicationService } from '@adonisjs/core/types'
import { UploadARRepository } from '#kernel/uploads/infrastructure/persistence/upload_ar_repository'

export default class RepositoryProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    if (this.app.nodeEnvironment !== 'test') {
      this.app.container.bind('UploadRepository', () => {
        return new UploadARRepository()
      })
    }
  }

  public async boot() {}
  public async ready() {}
  public async shutdown() {}
}
