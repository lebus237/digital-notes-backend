import { CollectionResponse } from '#shared/application/collection/collection_response'
import { GetNoteCollectionQuery } from '#kernel/notes/application/query/get_note_collection_query'
import { GetNoteDetailQuery } from '#kernel/notes/application/query/get_note_detail_query'
import { NoteStatus, NoteType } from '#kernel/organisation/domain/types/index'

export type NotePageData = {
  id: string
  uploadId: string
  url: string | null
  mimeType: string | null
  size: number | null
  sortOrder: number
}

export type NoteListItemData = {
  id: string
  courseId: string
  title: string
  description: string | null
  noteType: NoteType
  price: number
  status: NoteStatus
  uploadedBy: string
  providedAt: string | null
  publishedAt: string | null
  archivedAt: string | null
  pageCount: number
  createdAt: string
  updatedAt: string
}

export type NoteData = {
  id: string
  courseId: string
  title: string
  description: string | null
  noteType: NoteType
  price: number
  status: NoteStatus
  uploadedBy: string
  providedAt: string | null
  publishedAt: string | null
  archivedAt: string | null
  pages: NotePageData[]
  createdAt: string
  updatedAt: string
}

export interface NoteService {
  noteCollection(query: GetNoteCollectionQuery): Promise<CollectionResponse<NoteListItemData>>

  viewNote(query: GetNoteDetailQuery): Promise<NoteData>
}
