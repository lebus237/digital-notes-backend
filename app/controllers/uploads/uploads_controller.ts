import type { HttpContext } from '@adonisjs/core/http'
import { AppAbstractController } from '#shared/user_interface/controller/app_abstract_controller'
import {
  StoreUploadCommand,
  StoreUploadCommandReturnType,
} from '#kernel/uploads/application/command/store_upload_command'
import { AppFile } from '#shared/domain/app_file'
import type { StoragePath } from '#shared/application/services/upload/storage_path'
import { uploadSchema } from '#validators/upload_schema'
import { DeleteUploadCommand } from '#kernel/uploads/application/command/delete_upload_command'
import { AppId } from '#shared/domain/app_id'
import type User from '#database/active-records/user'

export default class UploadsController extends AppAbstractController {
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

    const payload = await request.validateUsing(uploadSchema)

    const result = await this.handleCommand<StoreUploadCommandReturnType>(
      new StoreUploadCommand(
        String(user.id),
        new AppFile(file),
        payload.title,
        payload.description ?? null,
        payload.storagePath as StoragePath | undefined
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
      new DeleteUploadCommand(String(user.id), AppId.fromString(params.id), user.role)
    )

    return response.noContent()
  }
}
