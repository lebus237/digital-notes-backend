import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Media } from '#kernel/medias/domain/media'

export interface MediaRepository extends RepositoryInterface {
  save(media: Media): Promise<string | void>
  findById(id: string): Promise<Media | null>
  findByUrl(url: string): Promise<Media | null>
  delete(id: string): Promise<void>
}
