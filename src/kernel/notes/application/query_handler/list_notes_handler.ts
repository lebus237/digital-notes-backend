import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { ListNotesQuery } from '#kernel/notes/application/query/list_notes_query'
import { NoteRepository } from '#kernel/notes/domain/note_repository'
import { Note } from '#kernel/notes/domain/note'

export class ListNotesHandler implements QueryHandler<ListNotesQuery, Note[]> {
  constructor(private readonly repository: NoteRepository) {}

  async handle(query: ListNotesQuery): Promise<Note[]> {
    return this.repository.list(
      {
        courseId: query.courseId,
        noteType: query.noteType,
        search: query.search,
      },
      { page: query.page, limit: query.limit }
    )
  }
}
