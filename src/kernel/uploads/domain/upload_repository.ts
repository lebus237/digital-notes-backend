import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Upload } from '#kernel/uploads/domain/upload'
import { AppId } from '#shared/domain/app_id'

export interface UploadRepository extends RepositoryInterface {
  save(upload: Upload): Promise<string | void>
  findById(id: AppId): Promise<Upload | null>
  findByUrl(url: string): Promise<Upload | null>
  delete(id: string): Promise<void>
}
