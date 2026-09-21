import { ApplicationError } from '#shared/application/errors/application_error'

export class HandlerNotRegisteredError extends ApplicationError {
  constructor(type: 'command' | 'query', name: string) {
    super('HANDLER_NOT_REGISTERED', 'Internal server error', { type, name })
  }
}
