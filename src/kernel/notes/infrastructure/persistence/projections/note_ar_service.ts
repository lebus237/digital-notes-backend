import { NoteRecord } from '#database/active-records/index'
import {
  NoteData,
  NoteListItemData,
  NoteService,
} from '#kernel/notes/application/services/note_service'
import { GetNoteCollectionQuery } from '#kernel/notes/application/query/get_note_collection_query'
import { GetNoteDetailQuery } from '#kernel/notes/application/query/get_note_detail_query'
import { NoteStatus } from '#kernel/notes/domain/entity/note'
import { NoteNotFoundError } from '#kernel/notes/domain/errors/note_not_found_error'
import { CollectionResponse } from '#shared/application/collection/collection_response'
import { mapPaginatedResult } from '#shared/infrastructure/collection/paginated_result'

export class NoteARService implements NoteService {
  async noteCollection(query: GetNoteCollectionQuery): Promise<CollectionResponse<NoteListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search

    const builder = NoteRecord.query()
      .where('course_id', query.courseId.value)
      .where('status', NoteStatus.PUBLISHED)

    if (query.noteType) {
      builder.where('note_type', query.noteType)
    }

    if (q) {
      builder.whereILike('title', `%${q}%`)
    }

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<NoteRecord, NoteListItemData>(results, (item) => ({
      id: item.id,
      courseId: item.courseId,
      title: item.title,
      description: item.description,
      fileKey: item.fileKey,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      noteType: item.noteType,
      price: item.price,
      status: item.status,
      uploadedBy: item.uploadedBy,
      publishedAt: item.publishedAt?.toISO() ?? null,
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async viewNote(query: GetNoteDetailQuery): Promise<NoteData> {
    const note = await NoteRecord.find(query.id.value)

    if (!note || (!query.includeUnpublished && note.status !== NoteStatus.PUBLISHED)) {
      throw new NoteNotFoundError()
    }

    return {
      id: note.id,
      courseId: note.courseId,
      title: note.title,
      description: note.description,
      fileKey: note.fileKey,
      fileSize: note.fileSize,
      mimeType: note.mimeType,
      noteType: note.noteType,
      price: note.price,
      status: note.status,
      uploadedBy: note.uploadedBy,
      publishedAt: note.publishedAt?.toISO() ?? null,
      createdAt: note.createdAt.toISO()!,
      updatedAt: note.updatedAt.toISO()!,
    }
  }
}
