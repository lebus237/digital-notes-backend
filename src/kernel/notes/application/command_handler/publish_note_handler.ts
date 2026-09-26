import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { PublishNoteCommand } from '#kernel/notes/application/command/publish_note_command'
import { NoteRepository } from '#kernel/notes/domain/note_repository'
import { NoteNotFoundError } from '#kernel/notes/domain/errors/note_not_found_error'

export class PublishNoteHandler implements CommandHandler<PublishNoteCommand, void> {
  constructor(private readonly repository: NoteRepository) {}

  async handle(command: PublishNoteCommand): Promise<void> {
    const note = await this.repository.findById(command.id)

    if (!note) {
      throw new NoteNotFoundError()
    }

    note.publish()

    await this.repository.save(note)
  }
}
