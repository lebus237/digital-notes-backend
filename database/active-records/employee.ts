import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import University from '#database/active-records/university'
import User from '#database/active-records/user'
import crypto from 'node:crypto'

export default class Employee extends BaseModel {
  static table = 'employees'

  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column({ columnName: 'university_id' })
  declare universityId: crypto.UUID

  @column({ columnName: 'user_id' })
  declare userId: crypto.UUID

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => University, { foreignKey: 'universityId' })
  declare university: BelongsTo<typeof University>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @beforeCreate()
  static async beforeCreate(employee: Employee) {
    employee.id = crypto.randomUUID()
  }
}
