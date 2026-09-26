import { Command } from '#shared/application/use-cases/command'

export class CreateLevelCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly departmentId: string,
    public readonly name: string
  ) {
    this.timestamp = new Date()
  }
}
