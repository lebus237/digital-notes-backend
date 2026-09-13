import { DocumentMediaRepository } from '#kernel/medias/domain/document_media_repository'
import { DocumentMedia } from '#kernel/medias/domain/document_media'
import { default as EntityActiveRecord } from '#database/active-records/document_media'
import { AppId } from '#shared/domain/app_id'
export class DocumentMediaARRepository implements DocumentMediaRepository {
  async save(entity: DocumentMedia): Promise<string | void> {
    const object = {
      url: entity.getUrl(),
      title: entity.getTitle(),
      description: entity.getDescription(),
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

  async findById(_id: string): Promise<DocumentMedia | null> {
    const document = await EntityActiveRecord.findOrFail(_id)

    return new DocumentMedia(
      new AppId(document.id),
      document.title,
      document.url,
      document.description,
      document.metadata,
      document.createdAt as any,
      document.updatedAt as any,
      document.relativeKey,
      document.createdBy
    )
  }

  async delete(id: string): Promise<void> {
    const document = await EntityActiveRecord.findOrFail(id)
    await document.delete()
  }

  async findByUrl(_url: string): Promise<DocumentMedia | null> {
    const document = await EntityActiveRecord.findBy('url', _url)

    if (!document) {
      return null
    }

    return new DocumentMedia(
      new AppId(document.id),
      document.title,
      document.url,
      document.description,
      document.metadata,
      document.createdAt as any,
      document.updatedAt as any,
      document.relativeKey,
      document.createdBy
    )
  }
}
