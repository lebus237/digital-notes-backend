import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#database/active-records/user'
import crypto from 'node:crypto'

export default class PasswordResetToken extends BaseModel {
  static table = 'password_reset_tokens'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column({ columnName: 'user_id' })
  declare userId: crypto.UUID

  @column({ columnName: 'token_hash' })
  declare tokenHash: string

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime

  @column.dateTime({ columnName: 'used_at' })
  declare usedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @beforeCreate()
  static async beforeCreate(token: PasswordResetToken) {
    token.id = crypto.randomUUID()
  }
}
