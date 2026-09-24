import { UploadRepository } from '#kernel/uploads/domain/upload_repository'
import { Upload } from '#kernel/uploads/domain/upload'
import { default as EntityActiveRecord } from '#database/active-records/uploads'
import { AppId } from '#shared/domain/app_id'
import { MediaType } from '#shared/application/services/upload/types'

export class UploadARRepository implements UploadRepository {
  async save(entity: Upload): Promise<string | void> {
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
      createdBy: entity.getCreatedBy(),
    }

    if (entity.getId()) {
      await EntityActiveRecord.updateOrCreate({ id: entity.getId() }, object)
      return Promise.resolve()
    }

    const result = await EntityActiveRecord.create(object)

    return result.id
  }

  async findById(_id: string): Promise<Upload | null> {
    const upload = await EntityActiveRecord.find(_id)

    if (!upload) {
      return null
    }

    return new Upload(
      new AppId(upload.id),
      upload.type as MediaType,
      upload.title,
      upload.url,
      upload.description,
      upload.mimeType,
      upload.size,
      upload.metadata,
      upload.createdAt as any,
      upload.updatedAt as any,
      upload.relativeKey,
      upload.createdBy
    )
  }

  async delete(id: string): Promise<void> {
    const upload = await EntityActiveRecord.findOrFail(id)
    await upload.delete()
  }

  async findByUrl(_url: string): Promise<Upload | null> {
    const upload = await EntityActiveRecord.findBy('url', _url)

    if (!upload) {
      return null
    }

    return new Upload(
      new AppId(upload.id),
      upload.type as MediaType,
      upload.title,
      upload.url,
      upload.description,
      upload.mimeType,
      upload.size,
      upload.metadata,
      upload.createdAt as any,
      upload.updatedAt as any,
      upload.relativeKey,
      upload.createdBy
    )
  }
}
