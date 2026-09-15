import { Command } from '#shared/application/use-cases/command'
import { AppFile } from '#shared/domain/app_file'

export type StoreMediaCommandReturnType = {
  id: string
  url: string
  signedUrl: string
  type: string
}

export class StoreMediaCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly file: AppFile,
    public readonly title: string = '',
    public readonly description: string | null = null
  ) {
    this.timestamp = new Date()
  }
}
