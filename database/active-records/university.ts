import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Faculty from '#database/active-records/faculty'
import crypto from 'node:crypto'

export default class University extends BaseModel {
  static table = 'universities'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column()
  declare name: string

  @column()
  declare slug: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Faculty, { foreignKey: 'universityId' })
  declare faculties: HasMany<typeof Faculty>

  @beforeCreate()
  static async beforeCreate(university: University) {
    university.id = crypto.randomUUID()
  }
}
