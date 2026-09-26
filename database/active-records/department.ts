import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Faculty from '#database/active-records/faculty'
import Level from '#database/active-records/level'
import Course from '#database/active-records/course'
import crypto from 'node:crypto'

export default class Department extends BaseModel {
  static table = 'departments'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column({ columnName: 'faculty_id' })
  declare facultyId: crypto.UUID

  @column()
  declare name: string

  @column()
  declare slug: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Faculty, { foreignKey: 'facultyId' })
  declare faculty: BelongsTo<typeof Faculty>

  @hasMany(() => Level, { foreignKey: 'departmentId' })
  declare levels: HasMany<typeof Level>

  @hasMany(() => Course, { foreignKey: 'departmentId' })
  declare courses: HasMany<typeof Course>

  @beforeCreate()
  static async beforeCreate(department: Department) {
    department.id = crypto.randomUUID()
  }
}
