import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Note from '#database/active-records/note'
import Upload from '#database/active-records/uploads'
import crypto from 'node:crypto'

export default class NotePage extends BaseModel {
  static table = 'note_pages'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column({ columnName: 'note_id' })
  declare noteId: crypto.UUID

  @column({ columnName: 'upload_id' })
  declare uploadId: crypto.UUID

  @column({ columnName: 'sort_order' })
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Note, { foreignKey: 'noteId' })
  declare note: BelongsTo<typeof Note>

  @belongsTo(() => Upload, { foreignKey: 'uploadId' })
  declare upload: BelongsTo<typeof Upload>

  @beforeCreate()
  static async beforeCreate(page: NotePage) {
    page.id = crypto.randomUUID()
  }
}
