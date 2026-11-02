import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Department from '#database/active-records/department'
import Course from '#database/active-records/course'
import crypto from 'node:crypto'

export default class Semester extends BaseModel {
  static table = 'semesters'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column({ columnName: 'department_id' })
  declare departmentId: crypto.UUID

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Department, { foreignKey: 'departmentId' })
  declare department: BelongsTo<typeof Department>

  @hasMany(() => Course, { foreignKey: 'semesterId' })
  declare courses: HasMany<typeof Course>

  @beforeCreate()
  static async beforeCreate(semester: Semester) {
    semester.id = crypto.randomUUID()
  }
}
