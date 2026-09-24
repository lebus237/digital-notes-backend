import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Upload } from '#kernel/uploads/domain/upload'

export interface UploadRepository extends RepositoryInterface {
  save(upload: Upload): Promise<string | void>
  findById(id: string): Promise<Upload | null>
  findByUrl(url: string): Promise<Upload | null>
  delete(id: string): Promise<void>
}
