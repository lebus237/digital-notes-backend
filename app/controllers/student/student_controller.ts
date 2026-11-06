import type { HttpContext } from '@adonisjs/core/http'
import type User from '#database/active-records/user'
import type { StudentService } from '#kernel/student/application/services/student_service'
import type { NoteService } from '#kernel/notes/application/services/note_service'
import { GetPublicNoteCollectionQuery } from '#kernel/notes/application/query/get_public_note_collection_query'
import { updateStudentProfileSchema } from '#validators/student_validator'
import { Pagination } from '#shared/application/read-model/pagination'
import { Search } from '#shared/application/read-model/search'
import { Filter } from '#shared/application/read-model/filter'
import { AppId } from '#shared/domain/app_id'

export default class StudentController {
  constructor(
    private studentService: StudentService,
    private noteService: NoteService
  ) {}

  private userId(ctx: HttpContext): string {
    return String((ctx.auth.user as User).id)
  }

  async profile(ctx: HttpContext) {
    const profile = await this.studentService.viewProfile(this.userId(ctx))
    return ctx.response.ok({ data: profile })
  }

  async updateProfile(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(updateStudentProfileSchema)
    const profile = await this.studentService.updateProfile(this.userId(ctx), payload)
    return ctx.response.ok({ data: profile })
  }

  async favoriteIds(ctx: HttpContext) {
    const ids = await this.studentService.favoriteIds(this.userId(ctx))
    return ctx.response.ok({ data: { ids } })
  }

  async favorites(ctx: HttpContext) {
    const ids = await this.studentService.favoriteIds(this.userId(ctx))
    return ctx.response.ok(await this.notesByIds(ids))
  }

  async addFavorite(ctx: HttpContext) {
    const noteId = AppId.fromString(ctx.request.param('noteId')).value
    await this.studentService.addFavorite(this.userId(ctx), noteId)
    return ctx.response.noContent()
  }

  async removeFavorite(ctx: HttpContext) {
    const noteId = AppId.fromString(ctx.request.param('noteId')).value
    await this.studentService.removeFavorite(this.userId(ctx), noteId)
    return ctx.response.noContent()
  }

  async history(ctx: HttpContext) {
    const ids = await this.studentService.historyIds(this.userId(ctx))
    return ctx.response.ok(await this.notesByIds(ids))
  }

  async recordView(ctx: HttpContext) {
    const noteId = AppId.fromString(ctx.request.param('noteId')).value
    await this.studentService.recordView(this.userId(ctx), noteId)
    return ctx.response.noContent()
  }

  private async notesByIds(ids: string[]) {
    if (ids.length === 0) {
      return {
        meta: { total: 0, perPage: 100, currentPage: 1, lastPage: 1 },
        data: [],
      }
    }

    return this.noteService.publicNoteCollection(
      new GetPublicNoteCollectionQuery(new Pagination(1, 100), new Search(''), new Filter({}), ids)
    )
  }
}
