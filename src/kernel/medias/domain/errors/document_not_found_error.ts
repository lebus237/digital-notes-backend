import { DomainError } from '#shared/domain/errors/domain_error'

export class DocumentNotFoundError extends DomainError {
  constructor(documentId: string) {
    super('DOCUMENT_NOT_FOUND', 'Document not found', { documentId })
  }
}
