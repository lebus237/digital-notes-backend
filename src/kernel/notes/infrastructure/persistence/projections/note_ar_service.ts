import { NoteRecord } from '#database/active-records/index'
import {
  NoteData,
  NoteListItemData,
  NotePageData,
} from '#kernel/notes/application/services/note_service'
import type { NoteService } from '#kernel/notes/application/services/note_service'
import { GetNoteCollectionQuery } from '#kernel/notes/application/query/get_note_collection_query'
import { GetNoteDetailQuery } from '#kernel/notes/application/query/get_note_detail_query'
import { NoteStatus } from '#kernel/organisation/domain/types/index'
import { NoteNotFoundError } from '#kernel/notes/domain/errors/note_not_found_error'
import { CollectionResponse } from '#shared/application/collection/collection_response'
import { mapPaginatedResult } from '#shared/infrastructure/collection/paginated_result'

export class NoteARService implements NoteService {
  async noteCollection(
    query: GetNoteCollectionQuery
  ): Promise<CollectionResponse<NoteListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search

    const builder = NoteRecord.query()
      .where('course_id', query.courseId.value)
      .where('status', NoteStatus.PUBLISHED)
      .preload('pages')

    if (query.noteType) {
      builder.where('note_type', query.noteType)
    }

    if (q) {
      builder.whereILike('title', `%${q}%`)
    }

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<NoteRecord, NoteListItemData>(results, (item: any) => ({
      id: item.id,
      courseId: item.courseId,
      title: item.title,
      description: item.description,
      noteType: item.noteType,
      price: item.price,
      status: item.status,
      uploadedBy: item.uploadedBy,
      providedAt: item.providedAt?.toISO() ?? null,
      publishedAt: item.publishedAt?.toISO() ?? null,
      archivedAt: item.archivedAt?.toISO() ?? null,
      pageCount: item.pages?.length ?? 0,
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async viewNote(query: GetNoteDetailQuery): Promise<NoteData> {
    const note: any = await NoteRecord.query()
      .where('id', query.id.value)
      .preload('pages', (pages) => pages.preload('upload').orderBy('sort_order', 'asc'))
      .first()

    if (!note || (!query.includeUnpublished && note.status !== NoteStatus.PUBLISHED)) {
      throw new NoteNotFoundError()
    }

    const pages: NotePageData[] = (note.pages ?? []).map((p: any) => ({
      id: p.id,
      uploadId: p.uploadId,
      url: p.upload?.url ?? null,
      mimeType: p.upload?.mimeType ?? null,
      size: p.upload?.size ?? null,
      sortOrder: p.sortOrder,
    }))

    return {
      id: note.id,
      courseId: note.courseId,
      title: note.title,
      description: note.description,
      noteType: note.noteType,
      price: note.price,
      status: note.status,
      uploadedBy: note.uploadedBy,
      providedAt: note.providedAt?.toISO() ?? null,
      publishedAt: note.publishedAt?.toISO() ?? null,
      archivedAt: note.archivedAt?.toISO() ?? null,
      pages,
      createdAt: note.createdAt.toISO()!,
      updatedAt: note.updatedAt.toISO()!,
    }
  }
}
