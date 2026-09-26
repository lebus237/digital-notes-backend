import { Command } from '#shared/application/use-cases/command'

export class UpdateCourseCommand implements Command {
  readonly timestamp: Date

  constructor(
    public readonly id: string,
    public readonly code?: string,
    public readonly name?: string,
    public readonly description?: string | null
  ) {
    this.timestamp = new Date()
  }
}
