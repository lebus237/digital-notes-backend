import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Department from '#database/active-records/department'
import Level from '#database/active-records/level'
import Semester from '#database/active-records/semester'
import Note from '#database/active-records/note'
import crypto from 'node:crypto'

export default class Course extends BaseModel {
  static table = 'courses'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column({ columnName: 'department_id' })
  declare departmentId: crypto.UUID

  @column({ columnName: 'level_id' })
  declare levelId: crypto.UUID

  @column({ columnName: 'semester_id' })
  declare semesterId: crypto.UUID

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({ columnName: 'is_archived' })
  declare isArchived: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Department, { foreignKey: 'departmentId' })
  declare department: BelongsTo<typeof Department>

  @belongsTo(() => Level, { foreignKey: 'levelId' })
  declare level: BelongsTo<typeof Level>

  @belongsTo(() => Semester, { foreignKey: 'semesterId' })
  declare semester: BelongsTo<typeof Semester>

  @hasMany(() => Note, { foreignKey: 'courseId' })
  declare notes: HasMany<typeof Note>

  static visible = scope((query) => {
    query.where('is_archived', false)
  })

  @beforeCreate()
  static async beforeCreate(course: Course) {
    course.id = crypto.randomUUID()
  }
}
