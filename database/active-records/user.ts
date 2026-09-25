import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import * as crypto from 'node:crypto'
import { UserRole } from '#kernel/user/domain/types/user_role'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email', 'phone_number'],
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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

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
