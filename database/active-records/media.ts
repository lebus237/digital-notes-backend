import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import crypto from 'node:crypto'

export default class Media extends BaseModel {
  static table = 'medias'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column()
  declare type: string

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare metadata: any

  @column()
  declare url: string

  @column({ columnName: 'mime_type' })
  declare mimeType: string | null

  @column()
  declare size: number | null

  @column({ columnName: 'relative_key' })
  declare relativeKey: string

  @column({ columnName: 'created_by' })
  declare createdBy: any

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static async beforeCreate(media: Media) {
    media.id = crypto.randomUUID()
  }
}
