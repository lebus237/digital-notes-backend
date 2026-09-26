import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { UploadNoteCommand } from '#kernel/notes/application/command/upload_note_command'
import { PublishNoteCommand } from '#kernel/notes/application/command/publish_note_command'
import { RejectNoteCommand } from '#kernel/notes/application/command/reject_note_command'
import { ArchiveNoteCommand } from '#kernel/notes/application/command/archive_note_command'
import { UpdateNoteMetadataCommand } from '#kernel/notes/application/command/update_note_metadata_command'
import { ListNotesQuery } from '#kernel/notes/application/query/list_notes_query'
import { GetNoteQuery } from '#kernel/notes/application/query/get_note_query'
import { AppFile } from '#shared/domain/app_file'
import { NoteType, type Note } from '#kernel/notes/domain/note'
import {
  uploadNoteSchema,
  updateNoteMetadataSchema,
} from '#validators/note_validator'
import type User from '#database/active-records/user'

export default class NotesController extends AppAbstractController {
  constructor() {
    super()
  }

  async index({ request, response }: HttpContext) {
    const qs = request.qs()
    const pagination = this.parseQueryPagination(qs)
    const search = this.parseQuerySearch(qs)
    const result = await this.handleQuery<Note[]>(
      new ListNotesQuery(
        request.param('courseId') ?? qs.courseId,
        qs.noteType,
        search.q || undefined,
        pagination.page,
        pagination.limit
      )
    )
    return response.ok(result)
  }

  async show({ auth, request, response }: HttpContext) {
    const user = auth.user as User | undefined
    const result = await this.handleQuery<Note>(
      new GetNoteQuery(request.param('id'), user?.role === 'administrator')
    )
    return response.ok(result)
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.user as User
    const file = request.file('file', {})
    const payload = await request.validateUsing(uploadNoteSchema)

    const id = await this.handleCommand<string>(
      new UploadNoteCommand(
        payload.courseId,
        payload.title,
        payload.description ?? null,
        (payload.noteType as NoteType) ?? NoteType.LECTURE_NOTES,
        payload.price ?? 0,
        new AppFile(file),
        String(user.id)
      )
    )
    return response.created({ id })
  }

  async update({ request, response }: HttpContext) {
    const payload = await request.validateUsing(updateNoteMetadataSchema)
    await this.handleCommand<void>(
      new UpdateNoteMetadataCommand(
        request.param('id'),
        payload.title,
        payload.description ?? null,
        payload.price
      )
    )
    return response.noContent()
  }

  async publish({ request, response }: HttpContext) {
    await this.handleCommand<void>(new PublishNoteCommand(request.param('id')))
    return response.noContent()
  }

  async reject({ request, response }: HttpContext) {
    await this.handleCommand<void>(new RejectNoteCommand(request.param('id')))
    return response.noContent()
  }

  async archive({ request, response }: HttpContext) {
    await this.handleCommand<void>(new ArchiveNoteCommand(request.param('id')))
    return response.noContent()
  }
}
