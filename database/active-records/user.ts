import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import * as crypto from 'node:crypto'
import { UserRole } from '#kernel/user/domain/types/user_role'
import University from '#database/active-records/university'
import Faculty from '#database/active-records/faculty'
import Department from '#database/active-records/department'
import Level from '#database/active-records/level'
import Semester from '#database/active-records/semester'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email', 'phoneNumber'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: crypto.UUID

  @column()
  declare role: UserRole

  @column({ columnName: 'full_name' })
  declare fullName: string | null

  @column()
  declare email: string

  @column({ columnName: 'phone_number' })
  declare phoneNumber: string

  @column({ serializeAs: null, columnName: 'password_hash' })
  declare password: string

  @column({ columnName: 'university_id' })
  declare universityId: crypto.UUID | null

  @column({ columnName: 'faculty_id' })
  declare facultyId: crypto.UUID | null

  @column({ columnName: 'department_id' })
  declare departmentId: crypto.UUID | null

  @column({ columnName: 'level_id' })
  declare levelId: crypto.UUID | null

  @column({ columnName: 'semester_id' })
  declare semesterId: crypto.UUID | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => University, { foreignKey: 'universityId' })
  declare university: BelongsTo<typeof University>

  @belongsTo(() => Faculty, { foreignKey: 'facultyId' })
  declare faculty: BelongsTo<typeof Faculty>

  @belongsTo(() => Department, { foreignKey: 'departmentId' })
  declare department: BelongsTo<typeof Department>

  @belongsTo(() => Level, { foreignKey: 'levelId' })
  declare level: BelongsTo<typeof Level>

  @belongsTo(() => Semester, { foreignKey: 'semesterId' })
  declare semester: BelongsTo<typeof Semester>

  @beforeCreate()
  static async generate(user: User) {
    user.id = crypto.randomUUID()
  }

  getId() {
    return this.id
  }

  getEmail() {
    return this.email
  }

  getPhoneNumber() {
    return this.phoneNumber
  }

  getFullName() {
    return this.fullName
  }

  getCreatedAt() {
    return this.createdAt
  }

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '7 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 50,
  })
}
