import { Command } from '#shared/application/use-cases/command'
import { AppFile } from '#shared/domain/app_file'

export type StoreUploadCommandReturnType = {
  id: string
  url: string
  signedUrl: string
  type: string
}

export class StoreUploadCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly actorId: string,
    public readonly file: AppFile,
    public readonly title: string = '',
    public readonly description: string | null = null
  ) {
    this.timestamp = new Date()
  }
}
