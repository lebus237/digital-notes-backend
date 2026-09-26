import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'
import { AppFile } from '#shared/domain/app_file'
import { NoteType } from '#kernel/notes/domain/entity/note'

export class UploadNoteCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly courseId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly noteType: NoteType,
    public readonly price: number,
    public readonly file: AppFile,
    public readonly uploadedBy: string
  ) {
    this.timestamp = DateTime.now()
  }
}
