import { Command } from '#shared/application/use-cases/command'

export class UpdateNoteMetadataCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly price: number
  ) {
    this.timestamp = new Date()
  }
}
