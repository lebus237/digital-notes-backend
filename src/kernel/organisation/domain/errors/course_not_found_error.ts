import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export class CourseNotFoundError extends DomainError {
  constructor() {
    super('ORGANISATION_COURSE_NOT_FOUND', 'Course not found', ErrorCategory.NOT_FOUND)
  }
}
