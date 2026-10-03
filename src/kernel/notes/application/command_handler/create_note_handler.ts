import { CommandHandler } from '#shared/application/use-cases/command_handler'
import { NoteRepository } from '#kernel/notes/domain/repository/note_repository'
import { CourseRepository } from '#kernel/organisation/domain/repository/course_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { Note } from '#kernel/notes/domain/entity/note'
import { CourseNotFoundError } from '#kernel/organisation/domain/errors/course_not_found_error'
import { StoragePath } from '#shared/application/services/upload/storage_path'
import { NoteStatus } from '#kernel/organisation/domain/types/index'
import { CreateNoteCommand } from '#kernel/notes/application/command/create_note_command'
import { Upload } from '#kernel/uploads/domain/upload'
import { MediaType } from '#shared/application/services/upload/types'
import { UploadRepository } from '#kernel/uploads/domain/upload_repository'
import { AppFile } from '#shared/domain/app_file'
import { NotePage } from '#kernel/notes/domain/entity/note_page'
import { AppId } from '#shared/domain/app_id'
import { DomainError } from '#shared/domain/errors/domain_error'
import { ErrorCategory } from '#shared/domain/errors/app_error'

export class CreateNoteHandler implements CommandHandler<CreateNoteCommand, AppId> {
  constructor(
    private readonly repository: NoteRepository,
    private readonly course: CourseRepository,
    private readonly upload: UploadRepository,
    private readonly mediaService: MediaManagerInterface
  ) {}

  private async uploadPage(
    page: AppFile,
    command: CreateNoteCommand
  ): Promise<{ id: string; key: string }> {
    const mediaType = this.mediaService.getMediaType(page.mimeType)
    if (!mediaType) {
      throw new DomainError(
        'NOTE_PAGE_UNSUPPORTED_TYPE',
        `Unsupported page mime type: ${page.mimeType}`,
        ErrorCategory.VALIDATION
      )
    }

    const upload = await this.mediaService.uploadFile(
      {
        buffer: await page.getBuffer(),
        originalName: page.originalName,
        mimeType: page.mimeType,
        size: page.size,
        storagePath: StoragePath.RAW_NOTES,
      },
      page.getFile()
    )

    if (!upload.success) {
      throw new DomainError(
        'NOTE_PAGE_UPLOAD_FAILED',
        'Page upload failed',
        ErrorCategory.INTERNAL,
        { cause: upload.error }
      )
    }

    const id = (await this.upload.save(
      new Upload(
        null,
        mediaType as MediaType,
        page.originalName,
        upload.url as string,
        null,
        page.mimeType,
        page.size,
        upload.metadata,
        null,
        null,
        upload.key,
        command.uploadedBy.value
      )
    )) as string

    return { id, key: upload.key as string }
  }

  async handle(command: CreateNoteCommand): Promise<AppId> {
    if (command.pages.length === 0) {
      throw new DomainError(
        'NOTE_PAGES_REQUIRED',
        'At least one page is required',
        ErrorCategory.VALIDATION
      )
    }

    const sortOrders = command.pages.map((p) => p.sortOrder)
    if (new Set(sortOrders).size !== sortOrders.length) {
      throw new DomainError(
        'NOTE_PAGE_ORDER_DUPLICATED',
        'Page sort orders must be unique',
        ErrorCategory.VALIDATION
      )
    }

    const course = await this.course.findById(command.courseId)

    if (!course || !course.isVisibleToStudents()) {
      throw new CourseNotFoundError()
    }

    const uploadedPages: Array<{ id: string; key: string; sortOrder: number }> = []
    try {
      const ordered = [...command.pages].sort((a, b) => a.sortOrder - b.sortOrder)
      for (const page of ordered) {
        const result = await this.uploadPage(page.file, command)
        uploadedPages.push({ id: result.id, key: result.key, sortOrder: page.sortOrder })
      }
    } catch (error) {
      for (const page of uploadedPages) {
        try {
          await this.mediaService.deleteFile(page.key)
        } catch {
          // best-effort compensation
        }
        try {
          await this.upload.delete(page.id)
        } catch {
          // best-effort compensation
        }
      }
      throw error
    }

    const pages = uploadedPages.map(
      (page) => new NotePage(null, page.sortOrder, null, AppId.fromString(page.id), null, null)
    )

    const note = new Note(
      null,
      command.courseId,
      command.title,
      command.description,
      command.noteType,
      command.price,
      NoteStatus.DRAFT,
      pages,
      command.uploadedBy,
      command.providedAt,
      null,
      null,
      null,
      null
    )

    return await this.repository.save(note)
  }
}
