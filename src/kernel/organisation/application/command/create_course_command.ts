import { Command } from '#shared/application/use-cases/command'

export class CreateCourseCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly departmentId: string,
    public readonly levelId: string,
    public readonly semesterId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly description: string | null = null
  ) {
    this.timestamp = new Date()
  }
}
