import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { SubmitNoteCommand } from '#kernel/notes/application/command/submit_note_command'
import { NoteRepository } from '#kernel/notes/domain/repository/note_repository'
import { NoteNotFoundError } from '#kernel/notes/domain/errors/note_not_found_error'
import { UserRole } from '#kernel/user/domain/types/user_role'

export class SubmitNoteHandler implements CommandHandler<SubmitNoteCommand, void> {
  constructor(private readonly repository: NoteRepository) {}

  async handle(command: SubmitNoteCommand): Promise<void> {
    const note = await this.repository.findById(command.id)

    /*
     * Keep the same anti-enumeration rule as note updates: a contributor who
     * does not own the note sees a 404, while admins can submit any note.
     */
    const isAdmin = command.actorRole === UserRole.ADMINISTRATOR
    if (!note || (!isAdmin && note.getUploadedBy().value !== command.actorId.value)) {
      throw new NoteNotFoundError()
    }

    note.submitForReview()

    await this.repository.save(note)
  }
}
