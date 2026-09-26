import { NoteRepository, NoteFilters, PaginationOptions } from '#kernel/notes/domain/note_repository'
import { Note, NoteStatus, NoteType } from '#kernel/notes/domain/note'
import { default as NoteRecord } from '#database/active-records/note'
import { AppId } from '#shared/domain/app_id'

export class NoteARRepository implements NoteRepository {
  async save(entity: Note): Promise<string | void> {
    const object = {
      courseId: entity.getCourseId() as any,
      title: entity.getTitle(),
      description: entity.getDescription(),
      fileKey: entity.getKey(),
      fileSize: entity.getFileSize(),
      mimeType: entity.getMimeType(),
      noteType: entity.getNoteType(),
      price: entity.getPrice(),
      status: entity.getStatus(),
      uploadedBy: entity.getUploadedBy() as any,
      publishedAt: entity.getPublishedAt() as any,
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    if (entity.getId()) {
      await NoteRecord.updateOrCreate({ id: entity.getId() }, object)
      return Promise.resolve()
    }

    const result = await NoteRecord.create(object)
    return result.id
  }

  async findById(id: string): Promise<Note | null> {
    const record = await NoteRecord.find(id)
    if (!record) return null
    return this.toNote(record)
  }

  async list(filters: NoteFilters, pagination: PaginationOptions): Promise<Note[]> {
    const query = NoteRecord.query()

    query.where('course_id', filters.courseId)

    if (!filters.includeUnpublished) {
      query.where('status', NoteStatus.PUBLISHED)
    }

    if (filters.noteType) {
      query.where('note_type', filters.noteType)
    }

    if (filters.search) {
      query.where((builder) => {
        builder.whereILike('title', `%${filters.search}%`)
      })
    }

    const records = await query.paginate(pagination.page, pagination.limit)
    return records.map((record) => this.toNote(record))
  }

  private toNote(record: NoteRecord): Note {
    return new Note(
      new AppId(record.id),
      String(record.courseId),
      record.title,
      record.description,
      record.fileKey,
      record.fileSize,
      record.mimeType,
      record.noteType as NoteType,
      record.price,
      record.status as NoteStatus,
      record.uploadedBy ? String(record.uploadedBy) : null,
      record.publishedAt as any,
      record.createdAt as any,
      record.updatedAt as any
    )
  }
}
