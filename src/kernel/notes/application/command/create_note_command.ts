import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'
import { AppId } from '#shared/domain/app_id'
import { NoteType } from '#kernel/organisation/domain/types/index'
import { AppFile } from '#shared/domain/app_file'

export class CreateNoteCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly courseId: AppId,
    public readonly title: string,
    public readonly description: string | null,
    public readonly noteType: NoteType,
    public readonly price: number,
    public readonly uploadedBy: AppId,
    public readonly providedAt: DateTime,
    public readonly pages: Array<{ file: AppFile; sortOrder: number }>
  ) {
    this.timestamp = DateTime.now()
  }
}
