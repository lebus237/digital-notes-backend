import { Query } from '#shared/application/use-cases/query'
import { NoteType } from '#kernel/notes/domain/note'

export class ListNotesQuery implements Query {
  readonly timestamp: Date

  constructor(
    public readonly courseId: string,
    public readonly noteType?: NoteType,
    public readonly search?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {
    this.timestamp = new Date()
  }
}
