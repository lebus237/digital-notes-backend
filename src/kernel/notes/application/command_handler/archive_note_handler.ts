import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { ArchiveNoteCommand } from '#kernel/notes/application/command/archive_note_command'
import { NoteRepository } from '#kernel/notes/domain/note_repository'
import { NoteNotFoundError } from '#kernel/notes/domain/errors/note_not_found_error'

export class ArchiveNoteHandler implements CommandHandler<ArchiveNoteCommand, void> {
  constructor(private readonly repository: NoteRepository) {}

  async handle(command: ArchiveNoteCommand): Promise<void> {
    const note = await this.repository.findById(command.id)

    if (!note) {
      throw new NoteNotFoundError()
    }

    note.archive()

    await this.repository.save(note)
  }
}
