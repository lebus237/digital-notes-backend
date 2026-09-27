import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { createEmployeeSchema } from '#validators/employee/employee_validator'
import { GetEmployeeCollectionQuery } from '#kernel/employee/application/use-cases/query/get_employee_collection_query'
import { GetEmployeeQuery } from '#kernel/employee/application/use-cases/query/get_employee_query'
import { CreateEmployeeCommand } from '#kernel/employee/application/use-cases/command/create_employee_command'
import { CreateEmployeeResult } from '#kernel/employee/application/use-cases/command_handler/create_employee_handler'
import { AppId } from '#shared/domain/app_id'
import type { EmployeeService } from '#kernel/employee/application/services/employee_service'

export default class EmployeeController extends AppAbstractController {
  constructor(private service: EmployeeService) {
    super()
  }

  async index({ request, response }: HttpContext) {
    const qs = request.qs()
    const result = await this.service.employeeCollection(
      new GetEmployeeCollectionQuery(
        qs.universityId ? AppId.fromString(qs.universityId) : null,
        this.getQueryPagination(qs),
        this.getQuerySearch(qs)
      )
    )
    return response.ok(result)
  }

  async show({ request, response }: HttpContext) {
    const result = await this.service.viewEmployee(
      new GetEmployeeQuery(AppId.fromString(request.param('id')))
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createEmployeeSchema)
    const result = await this.handleCommand<CreateEmployeeResult>(
      new CreateEmployeeCommand(
        AppId.fromString(payload.universityId),
        payload.fullName,
        payload.email,
        payload.phoneNumber,
        payload.role
      )
    )
    return response.created(result)
  }
}
