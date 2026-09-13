import { Command } from '#shared/application/use-cases/command'
import { AppFile } from '#shared/domain/app_file'

export type StoreImageCommandReturnType = { id: string; url: string; signedUrl: string }

export class StoreImageCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly file: AppFile,
    public readonly title: string = '',
    public readonly altDescription: string = ''
  ) {
    this.timestamp = new Date()
  }
}
