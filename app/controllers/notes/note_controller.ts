import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { CreateNoteCommand } from '#kernel/notes/application/command/create_note_command'
import { PublishNoteCommand } from '#kernel/notes/application/command/publish_note_command'
import { RejectNoteCommand } from '#kernel/notes/application/command/reject_note_command'
import { ArchiveNoteCommand } from '#kernel/notes/application/command/archive_note_command'
import { UpdateNoteCommand } from '#kernel/notes/application/command/update_note_command'
import { GetNoteCollectionQuery } from '#kernel/notes/application/query/get_note_collection_query'
import { GetNoteDetailQuery } from '#kernel/notes/application/query/get_note_detail_query'
import { AppId } from '#shared/domain/app_id'
import { AppFile } from '#shared/domain/app_file'
import { NoteType } from '#kernel/organisation/domain/types/index'
import { createNoteSchema, updateNoteSchema } from '#validators/note_validator'
import { DateTime } from 'luxon'
import type User from '#database/active-records/user'
import type { NoteService } from '#kernel/notes/application/services/note_service'

export default class NoteController extends AppAbstractController {
  constructor(private service: NoteService) {
    super()
  }

  async index({ request, response }: HttpContext) {
    const qs = request.qs()
    const result = await this.service.noteCollection(
      new GetNoteCollectionQuery(
        AppId.fromString(request.param('courseId') ?? qs.courseId),
        this.getQueryPagination(qs),
        this.getQuerySearch(qs),
        this.getQueryFilter(qs)
      )
    )
    return response.ok(result)
  }

  async show({ auth, request, response }: HttpContext) {
    const user = auth.user as User | undefined
    const result = await this.service.viewNote(
      new GetNoteDetailQuery(AppId.fromString(request.param('id')), user?.role === 'administrator')
    )
    return response.ok(result)
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.user as User
    const payload = await request.validateUsing(createNoteSchema)
    const pageFiles = request.files('pages')

    const pages = pageFiles?.map((file, index) => ({
      file: new AppFile(file),
      sortOrder: index,
    }))

    const id = await this.handleCommand<AppId>(
      new CreateNoteCommand(
        AppId.fromString(payload.courseId),
        payload.title,
        payload.description ?? null,
        payload.noteType as NoteType,
        payload.price ?? 0,
        AppId.fromString(String(user.id)),
        payload.providedAt ? DateTime.fromJSDate(payload.providedAt) : DateTime.now(),
        pages
      )
    )
    return response.created({ id: id.value })
  }

  async update({ request, response }: HttpContext) {
    const payload = await request.validateUsing(updateNoteSchema)
    await this.handleCommand<void>(
      new UpdateNoteCommand(
        AppId.fromString(request.param('id')),
        payload.title,
        payload.description,
        payload.price
      )
    )
    return response.noContent()
  }

  async publish({ request, response }: HttpContext) {
    await this.handleCommand<void>(new PublishNoteCommand(AppId.fromString(request.param('id'))))
    return response.noContent()
  }

  async reject({ request, response }: HttpContext) {
    await this.handleCommand<void>(new RejectNoteCommand(AppId.fromString(request.param('id'))))
    return response.noContent()
  }

  async archive({ request, response }: HttpContext) {
    await this.handleCommand<void>(new ArchiveNoteCommand(AppId.fromString(request.param('id'))))
    return response.noContent()
  }
}
