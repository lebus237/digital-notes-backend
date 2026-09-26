import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { createSemesterSchema } from '#validators/organisation/semester_validator'
import { GetSemesterCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_semester_collection_query'
import { CreateSemesterCommand } from '#kernel/organisation/application/use-cases/command/create_semester_command'
import type { SemesterService } from '#kernel/organisation/application/services/semester_service'

export default class SemesterController extends AppAbstractController {
  constructor(private service: SemesterService) {
    super()
  }

  async index({ request, response }: HttpContext) {
    const result = await this.service.semesterCollection(
      new GetSemesterCollectionQuery(
        this.getQueryPagination(request.qs()),
        this.getQuerySearch(request.qs())
      )
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createSemesterSchema)
    const id = await this.handleCommand<string>(new CreateSemesterCommand(payload.name))
    return response.created({ id })
  }
}
