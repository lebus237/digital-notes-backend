import { DomainError } from '#shared/domain/errors/domain_error'
import { ErrorCategory } from '#shared/domain/errors/app_error'
import crypto from 'node:crypto'
import _ from 'lodash'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// 248 + "-" + 6 hash chars = 255, matching the slug column width
const BASE_MAX_LENGTH = 248

export function generateUniqueSlug(value: string): string {
  const base = _.kebabCase(value)

  if (!base || !slugRegex.test(base)) {
    throw new DomainError(
      'INVALID_SLUG_SOURCE_VALUE',
      `Cannot build a slug from "${value}"`,
      ErrorCategory.VALIDATION
    )
  }

  const hash = crypto.randomBytes(3).toString('hex')

  return `${base.slice(0, BASE_MAX_LENGTH)}-${hash}`
}
