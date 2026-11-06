import { CollectionResponse } from '#shared/application/collection/collection_response'
import { GetNoteCollectionQuery } from '#kernel/notes/application/query/get_note_collection_query'
import { GetNoteDetailQuery } from '#kernel/notes/application/query/get_note_detail_query'
import { GetAdminNoteCollectionQuery } from '#kernel/notes/application/query/get_admin_note_collection_query'
import { GetContributorNoteCollectionQuery } from '#kernel/notes/application/query/get_contributor_note_collection_query'
import { GetPublicNoteCollectionQuery } from '#kernel/notes/application/query/get_public_note_collection_query'
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
  title: string
  noteType: NoteType
  price: number
  status: NoteStatus
  uploadedBy: string
  providedAt: string | null
  pageCount: number
  coverUrl?: string | null
  createdAt: string
  updatedAt: string
}

export type PublicNoteListItemData = NoteListItemData & {
  description: string | null
  courseId: string
  courseCode: string
  courseName: string
  departmentId: string | null
  departmentName: string | null
  facultyId: string | null
  facultyName: string | null
  universityId: string | null
  universityName: string | null
  contributorName: string | null
  publishedAt: string | null
}

export type AdminNoteListItemData = NoteListItemData & {
  courseCode: string
  courseName: string
}

export type NoteData = {
  id: string
  courseId: string
  courseCode: string
  courseName: string
  courseDepartmentId: string | null
  courseDepartmentName: string | null
  courseLevelName: string | null
  courseSemesterName: string | null
  title: string
  description: string | null
  noteType: NoteType
  price: number
  status: NoteStatus
  uploadedBy: string
  contributorName: string | null
  providedAt: string | null
  publishedAt: string | null
  archivedAt: string | null
  pages: NotePageData[]
  createdAt: string
  updatedAt: string
}

export interface NoteService {
  noteCollection(query: GetNoteCollectionQuery): Promise<CollectionResponse<NoteListItemData>>

  publicNoteCollection(
    query: GetPublicNoteCollectionQuery
  ): Promise<CollectionResponse<PublicNoteListItemData>>

  adminNoteCollection(
    query: GetAdminNoteCollectionQuery
  ): Promise<CollectionResponse<AdminNoteListItemData>>

  contributorNoteCollection(
    query: GetContributorNoteCollectionQuery
  ): Promise<CollectionResponse<AdminNoteListItemData>>

  viewNote(query: GetNoteDetailQuery): Promise<NoteData>
}
