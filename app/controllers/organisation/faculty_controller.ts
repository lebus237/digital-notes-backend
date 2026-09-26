import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { createFacultySchema } from '#validators/organisation/faculty_validator'
import { GetFacultyCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_faculty_collection_query'
import { CreateFacultyCommand } from '#kernel/organisation/application/use-cases/command/create_faculty_command'
import { AppId } from '#shared/domain/app_id'
import type { FacultyService } from '#kernel/organisation/application/services/faculty_service'

export default class FacultyController extends AppAbstractController {
  constructor(private service: FacultyService) {
    super()
  }

  async index({ request, response }: HttpContext) {
    const qs = request.qs()
    const result = await this.service.facultyCollection(
      new GetFacultyCollectionQuery(
        qs.universityId ? AppId.fromString(qs.universityId) : null,
        this.getQueryPagination(qs),
        this.getQuerySearch(qs)
      )
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
