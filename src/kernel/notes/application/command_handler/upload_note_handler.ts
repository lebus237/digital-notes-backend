import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { UploadNoteCommand } from '#kernel/notes/application/command/upload_note_command'
import { NoteRepository } from '#kernel/notes/domain/repository/note_repository'
import { CourseRepository } from '#kernel/organisation/domain/repository/course_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { Note, NoteStatus } from '#kernel/notes/domain/entity/note'
import { CourseNotFoundError } from '#kernel/organisation/domain/errors/course_not_found_error'
import { InfrastructureError } from '#infra/errors/infrastructure_error'
import { StoragePath } from '#shared/application/services/upload/storage_path'

export class UploadNoteHandler implements CommandHandler<UploadNoteCommand, string> {
  constructor(
    private readonly repository: NoteRepository,
    private readonly courses: CourseRepository,
    private readonly uploadService: MediaManagerInterface
  ) {}

  async handle(command: UploadNoteCommand): Promise<string> {
    const course = await this.courses.findById(command.courseId)

    if (!course || !course.isVisibleToStudents()) {
      throw new CourseNotFoundError()
    }

    const upload = await this.uploadService.uploadFile(
      {
        buffer: await command.file.getBuffer(),
        originalName: command.file.originalName,
        mimeType: command.file.mimeType,
        size: command.file.size,
        storagePath: StoragePath.DOCUMENTS,
      },
      command.file.getFile()
    )

    if (!upload.success) {
      throw new InfrastructureError('MEDIA_UPLOAD_FAILED', 'Upload failed', {
        cause: upload.error,
      })
    }

    const id = (await this.repository.save(
      new Note(
        null,
        command.courseId.value,
        command.title,
        command.description,
        upload.key as string,
        command.file.size,
        command.file.mimeType,
        command.noteType,
        command.price,
        NoteStatus.PENDING_REVIEW,
        command.uploadedBy,
        null,
        null,
        null
      )
    )) as string

    return id
  }
}
