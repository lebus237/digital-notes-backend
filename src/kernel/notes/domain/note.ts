import { AppId } from '#shared/domain/app_id'
import { DateTime } from 'luxon'
import { ErrorCategory } from '#shared/domain/errors/app_error'
import { DomainError } from '#shared/domain/errors/domain_error'

export enum NoteType {
  LECTURE_NOTES = 'LECTURE_NOTES',
  SUMMARY = 'SUMMARY',
  REVISION = 'REVISION',
  PAST_EXAM = 'PAST_EXAM',
  EXERCISES = 'EXERCISES',
}

export enum NoteStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export class Note {
  constructor(
    private readonly id: AppId | null,
    private readonly courseId: string,
    private title: string,
    private description: string | null,
    private readonly fileKey: string,
    private readonly fileSize: number | null,
    private readonly mimeType: string | null,
    private readonly noteType: NoteType,
    private price: number,
    private status: NoteStatus,
    private readonly uploadedBy: string | null,
    private publishedAt: DateTime | null,
    private readonly createdAt: DateTime | null,
    private readonly updatedAt: DateTime | null
  ) {}

  getId() {
    return this.id?.value
  }

  getCourseId(): string {
    return this.courseId
  }

  getTitle(): string {
    return this.title
  }

  getDescription(): string | null {
    return this.description
  }

  getKey(): string {
    return this.fileKey
  }

  getFileSize(): number | null {
    return this.fileSize
  }

  getMimeType(): string | null {
    return this.mimeType
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

  getUploadedBy(): string | null {
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

  isVisibleToStudents(): boolean {
    return this.status === NoteStatus.PUBLISHED
  }

  updateMetadata(title: string, description: string | null, price: number) {
    this.title = title
    this.description = description
    this.price = price
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
  }
}
