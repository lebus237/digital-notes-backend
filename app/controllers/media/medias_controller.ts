import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import {
  StoreMediaCommand,
  StoreMediaCommandReturnType,
} from '#kernel/medias/application/command/store_media_command'
import { AppFile } from '#shared/domain/app_file'
import { unifiedMediaSchema } from '#validators/unified_media_schema'
import { DeleteMediaCommand } from '#kernel/medias/application/command/delete_media_command'
import { AppId } from '#shared/domain/app_id'
import type User from '#database/active-records/user'

export default class MediasController extends AppAbstractController {
  constructor() {
    super()
  }
  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user as User
    const file = request.file('file', {})

    const payload = await request.validateUsing(unifiedMediaSchema)

    const result = await this.handleCommand<StoreMediaCommandReturnType>(
      new StoreMediaCommand(
        String(user.id),
        new AppFile(file),
        payload.title,
        payload.description ?? null
      )
    )

    return response.created(result)
  }

  /**
   * Delete record
   */
  async destroy({ auth, request, response }: HttpContext) {
    const user = auth.user as User
    const params = request.params()

    await this.handleCommand<void>(
      new DeleteMediaCommand(String(user.id), AppId.fromString(params.id), user.role)
    )

    return response.noContent()
  }
}
