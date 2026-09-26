import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { createLevelSchema } from '#validators/organisation/level_validator'
import { GetLevelCollectionQuery } from '#kernel/organisation/application/use-cases/query/get_level_collection_query'
import { CreateLevelCommand } from '#kernel/organisation/application/use-cases/command/create_level_command'
import { AppId } from '#shared/domain/app_id'
import type { LevelService } from '#kernel/organisation/application/services/level_service'

export default class LevelController extends AppAbstractController {
  constructor(private service: LevelService) {
    super()
  }

  async index({ request, response }: HttpContext) {
    const qs = request.qs()
    const result = await this.service.levelCollection(
      new GetLevelCollectionQuery(
        qs.departmentId ? AppId.fromString(qs.departmentId) : null,
        this.getQueryPagination(qs),
        this.getQuerySearch(qs)
      )
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createLevelSchema)
    const id = await this.handleCommand<string>(
      new CreateLevelCommand(AppId.fromString(payload.departmentId), payload.name)
    )
    return response.created({ id })
  }
}
