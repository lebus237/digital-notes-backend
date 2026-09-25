export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL',
}

export abstract class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly category: ErrorCategory,
    public readonly details?: Record<string, unknown>,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = new.target.name
  }
}
