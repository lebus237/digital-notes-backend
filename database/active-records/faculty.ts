import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import University from '#database/active-records/university'
import Department from '#database/active-records/department'
import crypto from 'node:crypto'

export default class Faculty extends BaseModel {
  static table = 'faculties'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column({ columnName: 'university_id' })
  declare universityId: crypto.UUID

  @column()
  declare name: string

  @column()
  declare slug: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => University, { foreignKey: 'universityId' })
  declare university: BelongsTo<typeof University>

  @hasMany(() => Department, { foreignKey: 'facultyId' })
  declare departments: HasMany<typeof Department>

  @beforeCreate()
  static async beforeCreate(faculty: Faculty) {
    faculty.id = crypto.randomUUID()
  }
}
