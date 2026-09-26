import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { UpdateNoteMetadataCommand } from '#kernel/notes/application/command/update_note_metadata_command'
import { NoteRepository } from '#kernel/notes/domain/repository/note_repository'
import { NoteNotFoundError } from '#kernel/notes/domain/errors/note_not_found_error'

export class UpdateNoteMetadataHandler implements CommandHandler<UpdateNoteMetadataCommand, void> {
  constructor(private readonly repository: NoteRepository) {}

  async handle(command: UpdateNoteMetadataCommand): Promise<void> {
    const note = await this.repository.findById(command.id)

    if (!note) {
      throw new NoteNotFoundError()
    }

    note.updateMetadata(command.title, command.description, command.price)

    await this.repository.save(note)
  }
}
