import { ApplicationError } from '#shared/application/errors/application_error'

export class HandlerNotRegisteredError extends ApplicationError {
  constructor(type: 'command' | 'query', name: string) {
    super('HANDLER_NOT_REGISTERED', `No handler registered for ${type}: ${name}`, { type, name })
  }
}
