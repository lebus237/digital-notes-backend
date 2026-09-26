import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { createUniversitySchema } from '#validators/organisation/university_validator'
import { GetUniversityCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_university_collection_query'
import { CreateUniversityCommand } from '#kernel/organisation/application/use-cases/command/create_university_command'
import type { UniversityService } from '#kernel/organisation/application/services/university_service'

export default class UniversityController extends AppAbstractController {
  constructor(private service: UniversityService) {
    super()
  }

  async index({ request, response }: HttpContext) {
    const result = await this.service.universityCollection(
      new GetUniversityCollectionQuery(
        this.getQueryPagination(request.qs()),
        this.getQuerySearch(request.qs())
      )
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
