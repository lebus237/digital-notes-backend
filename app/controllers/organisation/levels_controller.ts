import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import { CreateLevelCommand } from '#kernel/organisation/application/command/create_level_command'
import { ListLevelsQuery } from '#kernel/organisation/application/query/list_levels_query'
import { createLevelSchema } from '#validators/organisation/level_validator'
import type { Level } from '#kernel/organisation/domain/entity/level'

export default class LevelsController extends AppAbstractController {
  constructor() {
    super()
  }

  async index({ request, response }: HttpContext) {
    const pagination = this.parseQueryPagination(request.qs())
    const result = await this.handleQuery<Level[]>(
      new ListLevelsQuery(request.qs().departmentId, pagination.page, pagination.limit)
    )
    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createLevelSchema)
    const id = await this.handleCommand<string>(
      new CreateLevelCommand(payload.departmentId, payload.name)
    )
    return response.created({ id })
  }
}
