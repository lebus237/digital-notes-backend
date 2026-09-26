import { QueryHandler } from '#shared/application/use-cases/query_handler'
import { GetNoteQuery } from '#kernel/notes/application/query/get_note_query'
import { NoteRepository } from '#kernel/notes/domain/note_repository'
import { Note } from '#kernel/notes/domain/note'
import { NoteNotFoundError } from '#kernel/notes/domain/errors/note_not_found_error'

export class GetNoteHandler implements QueryHandler<GetNoteQuery, Note> {
  constructor(private readonly repository: NoteRepository) {}

  async handle(query: GetNoteQuery): Promise<Note> {
    const note = await this.repository.findById(query.id)

    if (!note || (!query.includeUnpublished && !note.isVisibleToStudents())) {
      throw new NoteNotFoundError()
    }

    return note
  }
}
