import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import {
  createSemesterSchema,
  updateSemesterSchema,
} from '#validators/organisation/semester_validator'
import { GetSemesterCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_semester_collection_query'
import { CreateSemesterCommand } from '#kernel/organisation/application/use-cases/command/create_semester_command'
import { UpdateSemesterCommand } from '#kernel/organisation/application/use-cases/command/update_semester_command'
import { AppId } from '#shared/domain/app_id'
import { DomainError } from '#shared/domain/errors/domain_error'
import { ErrorCategory } from '#shared/domain/errors/app_error'
import type { SemesterService } from '#kernel/organisation/application/services/semester_service'

export default class SemesterController extends AppAbstractController {
  constructor(private service: SemesterService) {
    super()
  }

  async index({ request, response }: HttpContext) {
    const qs = request.qs()
    if (!qs.departmentId) {
      throw new DomainError(
        'ORGANISATION_DEPARTMENT_ID_REQUIRED',
        'departmentId query parameter is required',
        ErrorCategory.VALIDATION
      )
    }
    const result = await this.service.semesterCollection(
      new GetSemesterCollectionQuery(
        AppId.fromString(qs.departmentId),
        this.getQueryPagination(qs),
        this.getQuerySearch(qs)
      )
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createSemesterSchema)
    const id = await this.handleCommand<string>(
      new CreateSemesterCommand(AppId.fromString(payload.departmentId), payload.name)
    )
    return response.created({ id })
  }

  async update({ request, response }: HttpContext) {
    const payload = await request.validateUsing(updateSemesterSchema)
    await this.handleCommand<void>(
      new UpdateSemesterCommand(AppId.fromString(request.param('id')), payload.name)
    )
    return response.noContent()
  }
}
