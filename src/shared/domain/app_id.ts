import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'
import crypto from 'node:crypto'

export class AppId {
  private static readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  constructor(private readonly _value: crypto.UUID) {}

  static generate() {
    return new AppId(crypto.randomUUID())
  }

  static fromString(value: string) {
    if (!this.uuidRegex.test(value)) {
      throw new DomainError(
        'INVALID_UUID_FORMAT_STRING',
        `Invalid UUID: "${value}"`,
        ErrorCategory.VALIDATION
      )
    }
    return new AppId(value as crypto.UUID)
  }

  get value() {
    return this._value
  }
}
