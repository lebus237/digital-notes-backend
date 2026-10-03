import { AppId } from '#shared/domain/app_id'
import { DateTime } from 'luxon'
import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'
import { NoteStatus, NoteType } from '#kernel/organisation/domain/types/index'
import { NotePage } from './note_page'

export class Note {
  constructor(
    private readonly id: AppId | null,
    private readonly courseId: AppId,
    private title: string,
    private description: string | null,
    private readonly noteType: NoteType,
    private price: number,
    private status: NoteStatus,
    private readonly pages: NotePage[],
    private readonly uploadedBy: AppId,
    private readonly providedAt: DateTime,
    private publishedAt: DateTime | null,
    private archivedAt: DateTime | null,
    private readonly createdAt: DateTime | null,
    private readonly updatedAt: DateTime | null
  ) {}

  getId() {
    return this.id?.value
  }

  getCourseId(): AppId {
    return this.courseId
  }

  getTitle(): string {
    return this.title
  }

  getDescription(): string | null {
    return this.description
  }

  getNoteType(): NoteType {
    return this.noteType
  }

  getPrice(): number {
    return this.price
  }

  getStatus(): NoteStatus {
    return this.status
  }

  getPages(): NotePage[] {
    return this.pages
  }

  getUploadedBy(): AppId {
    return this.uploadedBy
  }

  getPublishedAt(): DateTime | null {
    return this.publishedAt
  }

  getCreatedAt(): DateTime | null {
    return this.createdAt
  }

  getUpdatedAt(): DateTime | null {
    return this.updatedAt
  }

  getProvidedAt(): DateTime {
    return this.providedAt
  }

  getArchivedAt(): DateTime | null {
    return this.archivedAt
  }

  isVisibleToStudents(): boolean {
    return this.status === NoteStatus.PUBLISHED
  }

  update(title?: string, description?: string | null, price?: number) {
    if (title !== undefined) {
      this.title = title
    }
    if (description !== undefined) {
      this.description = description
    }
    if (price !== undefined) {
      this.price = price
    }
  }

  publish() {
    if (this.status !== NoteStatus.PENDING_REVIEW) {
      throw new DomainError(
        'NOTE_STATUS_TRANSITION_INVALID',
        `Cannot publish note in status ${this.status}`,
        ErrorCategory.CONFLICT
      )
    }
    this.status = NoteStatus.PUBLISHED
    this.publishedAt = DateTime.now()
  }

  reject() {
    if (this.status !== NoteStatus.PENDING_REVIEW) {
      throw new DomainError(
        'NOTE_STATUS_TRANSITION_INVALID',
        `Cannot reject note in status ${this.status}`,
        ErrorCategory.CONFLICT
      )
    }
    this.status = NoteStatus.REJECTED
  }

  archive() {
    this.status = NoteStatus.ARCHIVED
    this.archivedAt = DateTime.now()
  }
}
