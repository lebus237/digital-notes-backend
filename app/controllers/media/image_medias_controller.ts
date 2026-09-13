import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import {
  StoreImageCommand,
  StoreImageCommandReturnType,
} from '#kernel/medias/application/command/store_image_command'
import { AppFile } from '#shared/domain/app_file'
import { mediaSchema } from '#validators/media_schema'
import { DeleteImageCommand } from '#kernel/medias/application/command/delete_image_command'
import { AppId } from '#shared/domain/app_id'

export default class ImageMediasController extends AppAbstractController {
  constructor() {
    super()
  }
  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {}

  /**
   * Display form to create a new record
   */

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const file = request.file('image', {})

    const payload = await request.validateUsing(mediaSchema)

    const result = await this.handleCommand<StoreImageCommandReturnType>(
      new StoreImageCommand(new AppFile(file), payload.title, payload.alt)
    )

    return response.created(result)
  }

  /**
   * Show individual record
   */
  // async show({ params }: HttpContext) {}
  //
  // /**
  //  * Edit individual record
  //  */
  //
  // /**
  //  * Handle form submission for the edit action
  //  */
  // async update({ params, request }: HttpContext) {}
  //
  // /**
  //  * Delete record
  //  */
  async destroy({ request, response }: HttpContext) {
    const params = request.params()

    await this.handleCommand<void>(new DeleteImageCommand(AppId.fromString(params.id)))

    return response.noContent()
  }
}
