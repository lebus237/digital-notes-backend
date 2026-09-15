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
  async store({ request, response }: HttpContext) {
    const file = request.file('file', {})

    const payload = await request.validateUsing(unifiedMediaSchema)

    const result = await this.handleCommand<StoreMediaCommandReturnType>(
      new StoreMediaCommand(new AppFile(file), payload.title, payload.description ?? null)
    )

    return response.created(result)
  }

  /**
   * Delete record
   */
  async destroy({ request, response }: HttpContext) {
    const params = request.params()

    await this.handleCommand<void>(new DeleteMediaCommand(AppId.fromString(params.id)))

    return response.noContent()
  }
}
