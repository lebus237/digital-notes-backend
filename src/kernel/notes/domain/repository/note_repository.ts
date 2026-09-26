import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Note } from '#kernel/notes/domain/entity/note'

export interface NoteRepository extends RepositoryInterface {
  save(note: Note): Promise<string | void>
  findById(id: string): Promise<Note | null>
  delete(id: string): Promise<void>
}
