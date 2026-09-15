import { Command } from '#shared/application/use-cases/command'
import { AppId } from '#shared/domain/app_id'

export class DeleteMediaCommand implements Command {
  readonly timestamp: Date

  constructor(public readonly id: AppId) {
    this.timestamp = new Date()
  }
}
