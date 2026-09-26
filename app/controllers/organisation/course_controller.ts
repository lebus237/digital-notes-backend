import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { CreateCourseCommand } from '#kernel/organisation/application/use-cases/command/create_course_command'
import { UpdateCourseCommand } from '#kernel/organisation/application/use-cases/command/update_course_command'
import { ArchiveCourseCommand } from '#kernel/organisation/application/use-cases/command/archive_course_command'
import { GetCourseCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_course_collection_query'
import { GetCourseDetailQuery } from '#kernel/organisation/application/use-cases/query/get_course_detail_query'
import { AppId } from '#shared/domain/app_id'
import { createCourseSchema, updateCourseSchema } from '#validators/organisation/course_validator'
import type { CourseService } from '#kernel/organisation/application/services/course_service'

export default class CourseController extends AppAbstractController {
  constructor(private service: CourseService) {
    super()
  }

  async index({ request, response }: HttpContext) {
    const qs = request.qs()
    const result = await this.service.courseCollection(
      new GetCourseCollectionQuery(
        qs.departmentId ? AppId.fromString(qs.departmentId) : null,
        qs.levelId ? AppId.fromString(qs.levelId) : null,
        qs.semesterId ? AppId.fromString(qs.semesterId) : null,
        this.getQueryPagination(qs),
        this.getQuerySearch(qs)
      )
    )
    return response.ok(result)
  }

  async show({ request, response }: HttpContext) {
    const result = await this.service.viewCourse(
      new GetCourseDetailQuery(AppId.fromString(request.param('id')))
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createCourseSchema)
    const id = await this.handleCommand<string>(
      new CreateCourseCommand(
        AppId.fromString(payload.departmentId),
        AppId.fromString(payload.levelId),
        AppId.fromString(payload.semesterId),
        payload.code,
        payload.name,
        payload.description ?? null
      )
    )
    return response.created({ id })
  }

  async update({ request, response }: HttpContext) {
    const payload = await request.validateUsing(updateCourseSchema)
    await this.handleCommand<void>(
      new UpdateCourseCommand(
        AppId.fromString(request.param('id')),
        payload.code,
        payload.name,
        payload.description
      )
    )
    return response.noContent()
  }

  async archive({ request, response }: HttpContext) {
    await this.handleCommand<void>(
      new ArchiveCourseCommand(AppId.fromString(request.param('id')))
    )
    return response.noContent()
  }
}
