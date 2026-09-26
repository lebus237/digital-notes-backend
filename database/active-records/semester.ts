import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Course from '#database/active-records/course'
import crypto from 'node:crypto'

export default class Semester extends BaseModel {
  static table = 'semesters'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Course, { foreignKey: 'semesterId' })
  declare courses: HasMany<typeof Course>

  @beforeCreate()
  static async beforeCreate(semester: Semester) {
    semester.id = crypto.randomUUID()
  }
}
