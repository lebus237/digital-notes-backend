import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Course from '#database/active-records/course'
import User from '#database/active-records/user'
import NotePage from '#database/active-records/note_page'
import { NoteStatus, NoteType } from '#kernel/organisation/domain/types/index'
import crypto from 'node:crypto'

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

  @column({ columnName: 'note_type' })
  declare noteType: NoteType

  @column()
  declare price: number

  @column()
  declare status: NoteStatus

  @column({ columnName: 'uploaded_by' })
  declare uploadedBy: crypto.UUID

  @column.dateTime({ columnName: 'provided_at' })
  declare providedAt: DateTime | null

  @column.dateTime({ columnName: 'published_at' })
  declare publishedAt: DateTime | null

  @column.dateTime({ columnName: 'archived_at' })
  declare archivedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Course, { foreignKey: 'courseId' })
  declare course: BelongsTo<typeof Course>

  @belongsTo(() => User, { foreignKey: 'uploadedBy' })
  declare uploader: BelongsTo<typeof User>

  @hasMany(() => NotePage, { foreignKey: 'noteId' })
  declare pages: HasMany<typeof NotePage>

  static published = scope((query) => {
    query.where('status', NoteStatus.PUBLISHED)
  })

  @beforeCreate()
  static async beforeCreate(note: Note) {
    note.id = crypto.randomUUID()
  }
}
