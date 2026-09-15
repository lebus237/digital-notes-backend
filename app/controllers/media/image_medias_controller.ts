import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import {
  StoreMediaCommand,
  StoreMediaCommandReturnType,
} from '#kernel/medias/application/command/store_media_command'
import { AppFile } from '#shared/domain/app_file'
import { mediaSchema } from '#validators/media_schema'
import { DeleteMediaCommand } from '#kernel/medias/application/command/delete_media_command'
import { AppId } from '#shared/domain/app_id'

/**
 * @deprecated Use `MediasController` (`POST /api/media`) instead.
 * Kept as a backward-compatible shim: accepts the legacy `image` field
 * and `alt` caption, then delegates to the unified media pipeline.
 */
export default class ImageMediasController extends AppAbstractController {
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
    const file = request.file('image', {})

    const payload = await request.validateUsing(mediaSchema)

    const result = await this.handleCommand<StoreMediaCommandReturnType>(
      new StoreMediaCommand(new AppFile(file), payload.title, payload.alt ?? null)
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
