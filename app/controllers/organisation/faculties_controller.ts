import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { CreateFacultyCommand } from '#kernel/organisation/application/command/create_faculty_command'
import { ListFacultiesQuery } from '#kernel/organisation/application/query/list_faculties_query'
import { createFacultySchema } from '#validators/organisation/faculty_validator'
import type { Faculty } from '#kernel/organisation/domain/entity/faculty'

export default class FacultiesController extends AppAbstractController {
  constructor() {
    super()
  }

  async index({ request, response }: HttpContext) {
    const pagination = this.parseQueryPagination(request.qs())
    const result = await this.handleQuery<Faculty[]>(
      new ListFacultiesQuery(request.qs().universityId, pagination.page, pagination.limit)
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createFacultySchema)
    const id = await this.handleCommand<string>(
      new CreateFacultyCommand(payload.universityId, payload.name, payload.slug)
    )
    return response.created({ id })
  }
}
