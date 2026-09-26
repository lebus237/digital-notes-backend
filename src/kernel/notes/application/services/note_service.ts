import { CollectionResponse } from '#shared/application/collection/collection_response'
import { GetNoteCollectionQuery } from '#kernel/notes/application/query/get_note_collection_query'
import { GetNoteDetailQuery } from '#kernel/notes/application/query/get_note_detail_query'
import { NoteStatus, NoteType } from '#kernel/notes/domain/entity/note'

export type NoteListItemData = {
  id: string
  courseId: string
  title: string
  description: string | null
  fileKey: string
  fileSize: number | null
  mimeType: string | null
  noteType: NoteType
  price: number
  status: NoteStatus
  uploadedBy: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type NoteData = {
  id: string
  courseId: string
  title: string
  description: string | null
  fileKey: string
  fileSize: number | null
  mimeType: string | null
  noteType: NoteType
  price: number
  status: NoteStatus
  uploadedBy: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NoteService {
  noteCollection(query: GetNoteCollectionQuery): Promise<CollectionResponse<NoteListItemData>>

  viewNote(query: GetNoteDetailQuery): Promise<NoteData>
}
