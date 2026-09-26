import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { RejectNoteCommand } from '#kernel/notes/application/command/reject_note_command'
import { NoteRepository } from '#kernel/notes/domain/repository/note_repository'
import { NoteNotFoundError } from '#kernel/notes/domain/errors/note_not_found_error'

export class RejectNoteHandler implements CommandHandler<RejectNoteCommand, void> {
  constructor(private readonly repository: NoteRepository) {}

  async handle(command: RejectNoteCommand): Promise<void> {
    const note = await this.repository.findById(command.id)

    if (!note) {
      throw new NoteNotFoundError()
    }

    note.reject()

    await this.repository.save(note)
  }
}
