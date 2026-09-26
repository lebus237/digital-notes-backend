import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'
import { AppFile } from '#shared/domain/app_file'
import type { StoragePath } from '#shared/application/services/upload/storage_path'

export type StoreUploadCommandReturnType = {
  id: string
  url: string
  signedUrl: string
  type: string
}

export class StoreUploadCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly actorId: string,
    public readonly file: AppFile,
    public readonly title: string = '',
    public readonly description: string | null = null,
    public readonly storagePath?: StoragePath
  ) {
    this.timestamp = DateTime.now()
  }
}
