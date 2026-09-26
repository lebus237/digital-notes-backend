import { Query } from '#shared/application/use-cases/query'
import { DateTime } from 'luxon'
import { NoteType } from '#kernel/notes/domain/note'

export class ListNotesQuery implements Query {
  readonly timestamp: DateTime

  constructor(
    public readonly courseId: string,
    public readonly noteType?: NoteType,
    public readonly search?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {
    this.timestamp = DateTime.now()
  }
}
