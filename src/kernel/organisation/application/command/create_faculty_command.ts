import { Command } from '#shared/application/use-cases/command'

export class CreateFacultyCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly universityId: string,
    public readonly name: string,
    public readonly slug: string
  ) {
    this.timestamp = new Date()
  }
}
