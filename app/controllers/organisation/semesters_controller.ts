import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { CreateSemesterCommand } from '#kernel/organisation/application/command/create_semester_command'
import { ListSemestersQuery } from '#kernel/organisation/application/query/list_semesters_query'
import { createSemesterSchema } from '#validators/organisation/semester_validator'
import type { Semester } from '#kernel/organisation/domain/entity/semester'

export default class SemestersController extends AppAbstractController {
  constructor() {
    super()
  }

  async index({ request, response }: HttpContext) {
    const pagination = this.parseQueryPagination(request.qs())
    const result = await this.handleQuery<Semester[]>(
      new ListSemestersQuery(pagination.page, pagination.limit)
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createSemesterSchema)
    const id = await this.handleCommand<string>(new CreateSemesterCommand(payload.name))
    return response.created({ id })
  }
}
