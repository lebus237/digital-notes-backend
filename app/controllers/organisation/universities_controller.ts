import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { CreateUniversityCommand } from '#kernel/organisation/application/command/create_university_command'
import { ListUniversitiesQuery } from '#kernel/organisation/application/query/list_universities_query'
import { createUniversitySchema } from '#validators/organisation/university_validator'
import type { University } from '#kernel/organisation/domain/entity/university'

export default class UniversitiesController extends AppAbstractController {
  constructor() {
    super()
  }

  async index({ request, response }: HttpContext) {
    const pagination = this.parseQueryPagination(request.qs())
    const result = await this.handleQuery<University[]>(
      new ListUniversitiesQuery(pagination.page, pagination.limit)
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createUniversitySchema)
    const id = await this.handleCommand<string>(
      new CreateUniversityCommand(payload.name, payload.slug)
    )
    return response.created({ id })
  }
}
