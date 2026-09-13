import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import {
  StoreDocumentCommand,
  StoreDocumentCommandReturnType,
} from '#kernel/medias/application/command/store_document_command'
import { AppFile } from '#shared/domain/app_file'
import { documentSchema } from '#validators/document_schema'
import { DeleteDocumentCommand } from '#kernel/medias/application/command/delete_document_command'
import { AppId } from '#shared/domain/app_id'

export default class DocumentMediasController extends AppAbstractController {
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
    const file = request.file('document', {})

    const payload = await request.validateUsing(documentSchema)

    const result = await this.handleCommand<StoreDocumentCommandReturnType>(
      new StoreDocumentCommand(new AppFile(file), payload.title, payload.description)
    )

    return response.created(result)
  }

  /**
   * Delete record
   */
  async destroy({ request, response }: HttpContext) {
    const params = request.params()

    await this.handleCommand<void>(new DeleteDocumentCommand(AppId.fromString(params.id)))

    return response.noContent()
  }
}
