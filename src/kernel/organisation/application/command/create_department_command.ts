import { Command } from '#shared/application/use-cases/command'

export class CreateDepartmentCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly facultyId: string,
    public readonly name: string,
    public readonly slug: string
  ) {
    this.timestamp = new Date()
  }
}
