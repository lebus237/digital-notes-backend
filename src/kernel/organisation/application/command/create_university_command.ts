import { Command } from '#shared/application/use-cases/command'

export class CreateUniversityCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly name: string,
    public readonly slug: string
  ) {
    this.timestamp = new Date()
  }
}
