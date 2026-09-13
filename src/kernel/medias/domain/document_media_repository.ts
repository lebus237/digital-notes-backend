import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { DocumentMedia } from '#kernel/medias/domain/document_media'

export interface DocumentMediaRepository extends RepositoryInterface {
  save(documentMedia: DocumentMedia): Promise<string | void>
  findById(id: string): Promise<DocumentMedia | null>
  findByUrl(url: string): Promise<DocumentMedia | null>
  delete(id: string): Promise<void>
}
