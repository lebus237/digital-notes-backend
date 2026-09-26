import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Course from '#database/active-records/course'
import User from '#database/active-records/user'
import crypto from 'node:crypto'

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

export default class Note extends BaseModel {
  static table = 'notes'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column({ columnName: 'course_id' })
  declare courseId: crypto.UUID

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column({ columnName: 'file_key' })
  declare fileKey: string

  @column({ columnName: 'file_size' })
  declare fileSize: number | null

  @column({ columnName: 'mime_type' })
  declare mimeType: string | null

  @column({ columnName: 'note_type' })
  declare noteType: NoteType

  @column()
  declare price: number

  @column()
  declare status: NoteStatus

  @column({ columnName: 'uploaded_by' })
  declare uploadedBy: crypto.UUID | null

  @column.dateTime({ columnName: 'published_at' })
  declare publishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Course, { foreignKey: 'courseId' })
  declare course: BelongsTo<typeof Course>

  @belongsTo(() => User, { foreignKey: 'uploadedBy' })
  declare uploader: BelongsTo<typeof User>

  static published = scope((query) => {
    query.where('status', NoteStatus.PUBLISHED)
  })

  @beforeCreate()
  static async beforeCreate(note: Note) {
    note.id = crypto.randomUUID()
  }
}
