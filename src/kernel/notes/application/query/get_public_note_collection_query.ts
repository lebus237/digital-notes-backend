import { Pagination } from '#shared/application/read-model/pagination'
import { Search } from '#shared/application/read-model/search'
import { NoteType } from '#kernel/organisation/domain/types/index'
import { Query } from '#shared/application/use-cases/query'
import { DateTime } from 'luxon'
import { ApplicationError } from '#shared/application/errors/application_error'
import { ErrorCategory } from '#shared/domain/errors/app_error'
import { Filter } from '#shared/application/read-model/filter'
import { AppId } from '#shared/domain/app_id'

/**
 * Published notes across the whole catalogue. This powers the public home
 * feed, global browse/search and the personalised student home.
 */
export class GetPublicNoteCollectionQuery implements Query {
  readonly timestamp: DateTime

  constructor(
    public readonly pagination: Pagination,
    public readonly search: Search,
    public readonly filter: Filter | null,
    public readonly noteIds: string[] | null = null
  ) {
    if (
      filter !== null &&
      filter.entries.noteType !== undefined &&
      !Object.values(NoteType).includes(filter.entries.noteType)
    ) {
      throw new ApplicationError(
        'INVALID_NOTE_TYPE',
        `Invalid note type: ${filter.entries.noteType}`,
        ErrorCategory.VALIDATION
      )
    }

    for (const key of ['departmentId', 'levelId', 'semesterId']) {
      const value = filter?.entries[key]
      if (value !== undefined && value !== null && value !== '') {
        AppId.fromString(String(value))
      }
    }

    this.timestamp = DateTime.now()
  }
}
