import { MediaRepository } from '#kernel/medias/domain/media_repository'
import { Media } from '#kernel/medias/domain/media'
import { default as EntityActiveRecord } from '#database/active-records/media'
import { AppId } from '#shared/domain/app_id'
import { MediaType } from '#shared/application/services/upload/types'

export class MediaARRepository implements MediaRepository {
  async save(entity: Media): Promise<string | void> {
    const object = {
      type: entity.getType(),
      url: entity.getUrl(),
      title: entity.getTitle(),
      description: entity.getDescription(),
      mimeType: entity.getMimeType(),
      size: entity.getSize(),
      metadata: entity.getMetadata(),
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
      relativeKey: entity.getRelativeKey(),
    }

    if (entity.getId()) {
      await EntityActiveRecord.updateOrCreate({ id: entity.getId() }, object)
      return Promise.resolve()
    }

    const result = await EntityActiveRecord.create(object)

    return result.id
  }

  async findById(_id: string): Promise<Media | null> {
    const media = await EntityActiveRecord.findOrFail(_id)

    return new Media(
      new AppId(media.id),
      media.type as MediaType,
      media.title,
      media.url,
      media.description,
      media.mimeType,
      media.size,
      media.metadata,
      media.createdAt as any,
      media.updatedAt as any,
      media.relativeKey,
      media.createdBy
    )
  }

  async delete(id: string): Promise<void> {
    const media = await EntityActiveRecord.findOrFail(id)
    await media.delete()
  }

  async findByUrl(_url: string): Promise<Media | null> {
    const media = await EntityActiveRecord.findBy('url', _url)

    if (!media) {
      return null
    }

    return new Media(
      new AppId(media.id),
      media.type as MediaType,
      media.title,
      media.url,
      media.description,
      media.mimeType,
      media.size,
      media.metadata,
      media.createdAt as any,
      media.updatedAt as any,
      media.relativeKey,
      media.createdBy
    )
  }
}
