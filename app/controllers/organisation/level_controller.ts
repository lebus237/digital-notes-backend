import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { createLevelSchema, updateLevelSchema } from '#validators/organisation/level_validator'
import { GetLevelCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_level_collection_query'
import { CreateLevelCommand } from '#kernel/organisation/application/use-cases/command/create_level_command'
import { UpdateLevelCommand } from '#kernel/organisation/application/use-cases/command/update_level_command'
import { AppId } from '#shared/domain/app_id'
import { DomainError } from '#shared/domain/errors/domain_error'
import { ErrorCategory } from '#shared/domain/errors/app_error'
import type { LevelService } from '#kernel/organisation/application/services/level_service'

export default class LevelController extends AppAbstractController {
  constructor(private service: LevelService) {
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
    const result = await this.service.levelCollection(
      new GetLevelCollectionQuery(
        AppId.fromString(qs.departmentId),
        this.getQueryPagination(qs),
        this.getQuerySearch(qs)
      )
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createLevelSchema)
    const id = await this.handleCommand<string>(
      new CreateLevelCommand(AppId.fromString(payload.departmentId), payload.name, payload.year)
    )
    return response.created({ id })
  }

  async update({ request, response }: HttpContext) {
    const payload = await request.validateUsing(updateLevelSchema)
    await this.handleCommand<void>(
      new UpdateLevelCommand(AppId.fromString(request.param('id')), payload.name, payload.year)
    )
    return response.noContent()
  }
}
