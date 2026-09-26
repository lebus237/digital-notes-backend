import { Command } from '#shared/application/use-cases/command'

export class RejectNoteCommand implements Command {
  readonly timestamp: Date

  constructor(public readonly id: string) {
    this.timestamp = new Date()
  }
}
