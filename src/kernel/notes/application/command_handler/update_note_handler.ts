import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { UpdateNoteCommand } from '#kernel/notes/application/command/update_note_command'
import { NoteRepository } from '#kernel/notes/domain/repository/note_repository'
import { NoteNotFoundError } from '#kernel/notes/domain/errors/note_not_found_error'
import { UserRole } from '#kernel/user/domain/types/user_role'

export class UpdateNoteHandler implements CommandHandler<UpdateNoteCommand, void> {
  constructor(private readonly repository: NoteRepository) {}

  async handle(command: UpdateNoteCommand): Promise<void> {
    const note = await this.repository.findById(command.id)

    /*
     * Contributors may only edit their own notes. A foreign note is reported
     * as missing so the endpoint cannot be used to enumerate note ids.
     */
    const isAdmin = command.actorRole === UserRole.ADMINISTRATOR
    if (!note || (!isAdmin && note.getUploadedBy().value !== command.actorId.value)) {
      throw new NoteNotFoundError()
    }

    note.update(command.title, command.description, command.price)

    await this.repository.save(note)
  }
}
