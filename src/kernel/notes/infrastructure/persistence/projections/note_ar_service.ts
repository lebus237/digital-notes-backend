import { NoteRecord } from '#database/active-records/index'
import {
  AdminNoteListItemData,
  NoteData,
  NoteListItemData,
  NotePageData,
} from '#kernel/notes/application/services/note_service'
import type { NoteService } from '#kernel/notes/application/services/note_service'
import { GetNoteCollectionQuery } from '#kernel/notes/application/query/get_note_collection_query'
import { GetAdminNoteCollectionQuery } from '#kernel/notes/application/query/get_admin_note_collection_query'
import { GetContributorNoteCollectionQuery } from '#kernel/notes/application/query/get_contributor_note_collection_query'
import { GetNoteDetailQuery } from '#kernel/notes/application/query/get_note_detail_query'
import { NoteNotFoundError } from '#kernel/notes/domain/errors/note_not_found_error'
import { NoteStatus } from '#kernel/organisation/domain/types/index'
import { CollectionResponse } from '#shared/application/collection/collection_response'
import { mapPaginatedResult } from '#shared/infrastructure/collection/paginated_result'

export class NoteARService implements NoteService {
  async noteCollection(
    query: GetNoteCollectionQuery
  ): Promise<CollectionResponse<NoteListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search
    const { status, noteType } = query.filter?.entries ?? {}

    const builder = NoteRecord.query().where('course_id', query.courseId.value).preload('pages')

    if (query.includeUnpublished) {
      if (status) {
        builder.where('status', status)
      }
    } else {
      /*
       * The public catalogue must never expose drafts, notes under review,
       * rejected notes or archives. Admin reads use includeUnpublished.
       */
      builder.where('status', NoteStatus.PUBLISHED)
    }

    if (noteType) {
      builder.where('note_type', noteType)
    }

    if (q) {
      builder.whereILike('title', `%${q}%`)
    }

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<NoteRecord, NoteListItemData>(results, (item: any) => ({
      id: item.id,
      title: item.title,
      noteType: item.noteType,
      price: item.price,
      status: item.status,
      uploadedBy: item.uploadedBy,
      providedAt: item.providedAt?.toISO() ?? null,
      pageCount: item.pages?.length ?? 0,
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async adminNoteCollection(
    query: GetAdminNoteCollectionQuery
  ): Promise<CollectionResponse<AdminNoteListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search
    const { status, noteType } = query.filter?.entries ?? {}

    const builder = NoteRecord.query().preload('course').preload('pages')

    if (query.courseId) {
      builder.where('course_id', query.courseId.value)
    }

    if (status) {
      builder.where('status', status)
    }

    if (noteType) {
      builder.where('note_type', noteType)
    }

    if (q) {
      builder.whereILike('title', `%${q}%`)
    }

    builder.orderBy('updated_at', 'desc')

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<NoteRecord, AdminNoteListItemData>(results, (item: any) => ({
      id: item.id,
      title: item.title,
      noteType: item.noteType,
      price: item.price,
      status: item.status,
      uploadedBy: item.uploadedBy,
      providedAt: item.providedAt?.toISO() ?? null,
      pageCount: item.pages?.length ?? 0,
      courseCode: item.course?.code ?? '',
      courseName: item.course?.name ?? '',
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async contributorNoteCollection(
    query: GetContributorNoteCollectionQuery
  ): Promise<CollectionResponse<AdminNoteListItemData>> {
    const { page, limit } = query.pagination
    const { q } = query.search
    const { status, noteType } = query.filter?.entries ?? {}

    const builder = NoteRecord.query()
      .where('uploaded_by', query.uploadedBy.value)
      .preload('course')
      .preload('pages')

    if (status) {
      builder.where('status', status)
    }

    if (noteType) {
      builder.where('note_type', noteType)
    }

    if (q) {
      builder.whereILike('title', `%${q}%`)
    }

    builder.orderBy('updated_at', 'desc')

    const results = await builder.paginate(page, limit)

    return mapPaginatedResult<NoteRecord, AdminNoteListItemData>(results, (item: any) => ({
      id: item.id,
      title: item.title,
      noteType: item.noteType,
      price: item.price,
      status: item.status,
      uploadedBy: item.uploadedBy,
      providedAt: item.providedAt?.toISO() ?? null,
      pageCount: item.pages?.length ?? 0,
      courseCode: item.course?.code ?? '',
      courseName: item.course?.name ?? '',
      createdAt: item.createdAt.toISO()!,
      updatedAt: item.updatedAt.toISO()!,
    }))
  }

  async viewNote(query: GetNoteDetailQuery): Promise<NoteData> {
    const note: any = await NoteRecord.query()
      .where('id', query.id.value)
      .preload('course')
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
      courseCode: note.course?.code ?? '',
      courseName: note.course?.name ?? '',
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
