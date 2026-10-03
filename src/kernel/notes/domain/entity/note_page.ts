import { AppId } from '#shared/domain/app_id'
import { DateTime } from 'luxon'

export class NotePage {
  constructor(
    private readonly id: AppId | null,
    private sortOrder: number,
    private readonly noteId: AppId | null,
    private readonly uploadId: AppId | null,
    private readonly createdAt: DateTime | null,
    private readonly updatedAt: DateTime | null
  ) {}

  getId(): string | undefined {
    return this.id?.value
  }

  getSortOrder(): number {
    return this.sortOrder
  }

  getNoteId(): AppId | null {
    return this.noteId
  }

  getUploadId(): AppId | null {
    return this.uploadId
  }

  getCreatedAt(): DateTime | null {
    return this.createdAt
  }

  getUpdatedAt(): DateTime | null {
    return this.updatedAt
  }

  reorder(sortOrder: number) {
    this.sortOrder = sortOrder
  }
}
