import { ImageMediaRepository } from '#kernel/medias/domain/image_media_repository'
import { ImageMedia } from '#kernel/medias/domain/image_media'
import { default as EntityActiveRecord } from '#database/active-records/image_media'
import { AppId } from '#shared/domain/app_id'
export class ImageMediaARRepository implements ImageMediaRepository {
  async save(entity: ImageMedia): Promise<string | void> {
    const object = {
      url: entity.getUrl(),
      title: entity.getTitle(),
      altDescription: entity.getAltDescription(),
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

  async findById(_id: string): Promise<ImageMedia | null> {
    const image = await EntityActiveRecord.findOrFail(_id)

    return new ImageMedia(
      new AppId(image.id),
      image.title,
      image.url,
      image.altDescription,
      image.metadata,
      image.createdAt as any,
      image.updatedAt as any,
      image.relativeKey,
      image.createdBy
    )
  }

  async delete(id: string): Promise<void> {
    const image = await EntityActiveRecord.findOrFail(id)
    await image.delete()
  }

  async findByUrl(_url: string): Promise<ImageMedia | null> {
    const image = await EntityActiveRecord.findBy('url', _url)

    if (!image) {
      return null
    }

    return new ImageMedia(
      new AppId(image.id),
      image.title,
      image.url,
      image.altDescription,
      image.metadata,
      image.createdAt as any,
      image.updatedAt as any,
      image.relativeKey,
      image.createdBy
    )
  }
}
