import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { createDepartmentSchema } from '#validators/organisation/department_validator'
import { GetDepartmentCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_department_collection_query'
import { CreateDepartmentCommand } from '#kernel/organisation/application/use-cases/command/create_department_command'
import { AppId } from '#shared/domain/app_id'
import type { DepartmentService } from '#kernel/organisation/application/services/department_service'

export default class DepartmentController extends AppAbstractController {
  constructor(private service: DepartmentService) {
    super()
  }

  async index({ request, response }: HttpContext) {
    const qs = request.qs()
    const result = await this.service.departmentCollection(
      new GetDepartmentCollectionQuery(
        qs.facultyId ? AppId.fromString(qs.facultyId) : null,
        this.getQueryPagination(qs),
        this.getQuerySearch(qs)
      )
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createDepartmentSchema)
    const id = await this.handleCommand<string>(
      new CreateDepartmentCommand(payload.facultyId, payload.name, payload.slug)
    )
    return response.created({ id })
  }
}
