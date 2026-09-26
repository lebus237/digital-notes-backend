import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { CreateDepartmentCommand } from '#kernel/organisation/application/command/create_department_command'
import { ListDepartmentsQuery } from '#kernel/organisation/application/query/list_departments_query'
import { createDepartmentSchema } from '#validators/organisation/department_validator'
import type { Department } from '#kernel/organisation/domain/entity/department'

export default class DepartmentsController extends AppAbstractController {
  constructor() {
    super()
  }

  async index({ request, response }: HttpContext) {
    const pagination = this.parseQueryPagination(request.qs())
    const result = await this.handleQuery<Department[]>(
      new ListDepartmentsQuery(request.qs().facultyId, pagination.page, pagination.limit)
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
