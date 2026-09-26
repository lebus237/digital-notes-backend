import { ErrorCategory } from '#shared/domain/errors/app_error'
import { ApplicationError } from '#shared/application/errors/application_error'

export type SortDirection = 'asc' | 'desc'

export class Order {
  constructor(public entries: Record<string, SortDirection> = { created_at: 'desc' }) {
    if (Object.values(entries).find((value) => value !== 'asc' && value !== 'desc')) {
      throw new ApplicationError(
        'INVALID_SORT_DIRECTION',
        'Invalid sort direction passed',
        ErrorCategory.VALIDATION
      )
    }
  }
}
