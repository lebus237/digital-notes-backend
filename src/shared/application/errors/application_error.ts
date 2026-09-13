export class ApplicationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = new.target.name
  }
}
