import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#database/active-records/user'
import Note from '#database/active-records/note'
import crypto from 'node:crypto'

export default class NoteFavorite extends BaseModel {
  static table = 'note_favorites'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column({ columnName: 'user_id' })
  declare userId: crypto.UUID

  @column({ columnName: 'note_id' })
  declare noteId: crypto.UUID

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Note, { foreignKey: 'noteId' })
  declare note: BelongsTo<typeof Note>

  @beforeCreate()
  static async beforeCreate(favorite: NoteFavorite) {
    favorite.id = crypto.randomUUID()
  }
}
