import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class NoteNotFoundError extends DomainError {
  constructor() {
    super('NOTE_NOT_FOUND', 'Note not found', ErrorCategory.NOT_FOUND)
  }
}
