import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Note, NoteType } from '#kernel/notes/domain/note'

export type NoteFilters = {
  courseId: string
  noteType?: NoteType
  search?: string
  includeUnpublished?: boolean
}

export type PaginationOptions = {
  page: number
  limit: number
}

export interface NoteRepository extends RepositoryInterface {
  save(note: Note): Promise<string | void>
  findById(id: string): Promise<Note | null>
  list(filters: NoteFilters, pagination: PaginationOptions): Promise<Note[]>
}
