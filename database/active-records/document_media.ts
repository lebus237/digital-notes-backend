import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import crypto from 'node:crypto'

export default class DocumentMedia extends BaseModel {
  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare metadata: any

  @column()
  declare url: string

  @column({ columnName: 'relative_key' })
  declare relativeKey: string

  @column({ columnName: 'created_by' })
  declare createdBy: any

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static async beforeCreate(document: DocumentMedia) {
    document.id = crypto.randomUUID()
  }
}
