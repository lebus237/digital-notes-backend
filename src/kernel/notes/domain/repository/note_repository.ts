import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Note } from '#kernel/notes/domain/entity/note'
import { AppId } from '#shared/domain/app_id'

export interface NoteRepository extends RepositoryInterface {
  save(note: Note): Promise<AppId>
  findById(id: AppId): Promise<Note | null>
  delete(id: AppId): Promise<void>
}
