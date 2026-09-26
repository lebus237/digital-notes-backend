import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { CreateCourseCommand } from '#kernel/organisation/application/command/create_course_command'
import { UpdateCourseCommand } from '#kernel/organisation/application/command/update_course_command'
import { ArchiveCourseCommand } from '#kernel/organisation/application/command/archive_course_command'
import { ListCoursesQuery } from '#kernel/organisation/application/query/list_courses_query'
import { GetCourseQuery } from '#kernel/organisation/application/query/get_course_query'
import { createCourseSchema, updateCourseSchema } from '#validators/organisation/course_validator'
import type { Course } from '#kernel/organisation/domain/entity/course'

export default class CoursesController extends AppAbstractController {
  constructor() {
    super()
  }

  async index({ request, response }: HttpContext) {
    const qs = request.qs()
    const pagination = this.parseQueryPagination(qs)
    const search = this.parseQuerySearch(qs)
    const result = await this.handleQuery<Course[]>(
      new ListCoursesQuery(
        {
          departmentId: qs.departmentId,
          levelId: qs.levelId,
          semesterId: qs.semesterId,
          search: search.q || undefined,
        },
        pagination.page,
        pagination.limit
      )
    )
    return response.ok(result)
  }

  async show({ request, response }: HttpContext) {
    const result = await this.handleQuery<Course>(new GetCourseQuery(request.param('id')))
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createCourseSchema)
    const id = await this.handleCommand<string>(
      new CreateCourseCommand(
        payload.departmentId,
        payload.levelId,
        payload.semesterId,
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
      new UpdateCourseCommand(request.param('id'), payload.code, payload.name, payload.description)
    )
    return response.noContent()
  }

  async archive({ request, response }: HttpContext) {
    await this.handleCommand<void>(new ArchiveCourseCommand(request.param('id')))
    return response.noContent()
  }
}
