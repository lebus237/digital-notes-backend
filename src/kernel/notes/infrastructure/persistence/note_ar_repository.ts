import { NoteRepository } from '#kernel/notes/domain/repository/note_repository'
import { Note } from '#kernel/notes/domain/entity/note'
import { NotePage } from '#kernel/notes/domain/entity/note_page'
import { NoteStatus, NoteType } from '#kernel/organisation/domain/types/index'
import { default as NoteRecord } from '#database/active-records/note'
import { default as NotePageRecord } from '#database/active-records/note_page'
import { AppId } from '#shared/domain/app_id'

export class NoteARRepository implements NoteRepository {
  async save(entity: Note): Promise<AppId> {
    const object = {
      courseId: entity.getCourseId().value as any,
      title: entity.getTitle(),
      description: entity.getDescription(),
      noteType: entity.getNoteType(),
      price: entity.getPrice(),
      status: entity.getStatus(),
      uploadedBy: entity.getUploadedBy().value as any,
      providedAt: entity.getProvidedAt() as any,
      publishedAt: entity.getPublishedAt() as any,
      archivedAt: entity.getArchivedAt() as any,
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    if (entity.getId()) {
      const id = AppId.fromString(entity.getId()!)
      await NoteRecord.updateOrCreate({ id: entity.getId() }, object)
      const noteId = id.value as any
      // Replace pages (simplest correct sync for metadata updates)
      await NotePageRecord.query().where('note_id', noteId).delete()
      for (const page of entity.getPages()) {
        await NotePageRecord.create({
          noteId,
          uploadId: page.getUploadId()?.value as any,
          sortOrder: page.getSortOrder(),
        } as any)
      }
      return id
    }

    const result = await NoteRecord.create(object)
    const noteId = result.id as any
    for (const page of entity.getPages()) {
      await NotePageRecord.create({
        noteId,
        uploadId: page.getUploadId()?.value as any,
        sortOrder: page.getSortOrder(),
      } as any)
    }
    return AppId.fromString(result.id)
  }

  async findById(id: AppId): Promise<Note | null> {
    const record = await NoteRecord.query().where('id', id.value).preload('pages').first()
    if (!record) return null
    return this.toNote(record)
  }

  async delete(id: AppId): Promise<void> {
    const record = await NoteRecord.findOrFail(id.value)
    await record.delete()
  }

  private toNote(record: NoteRecord): Note {
    const pages = ((record as any).pages ?? [])
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map(
        (p: any) =>
          new NotePage(
            AppId.fromString(p.id),
            p.sortOrder,
            AppId.fromString(p.noteId ?? (record as any).id),
            AppId.fromString(p.uploadId),
            p.createdAt ?? null,
            p.updatedAt ?? null
          )
      )
    return new Note(
      AppId.fromString((record as any).id),
      AppId.fromString((record as any).courseId),
      (record as any).title,
      (record as any).description,
      (record as any).noteType as NoteType,
      (record as any).price,
      (record as any).status as NoteStatus,
      pages,
      AppId.fromString((record as any).uploadedBy),
      (record as any).providedAt,
      (record as any).publishedAt,
      (record as any).archivedAt,
      (record as any).createdAt,
      (record as any).updatedAt
    )
  }
}
