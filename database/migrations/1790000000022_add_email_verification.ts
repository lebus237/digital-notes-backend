import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('email_verified_at').nullable()
    })

    this.schema.createTable('email_verification_tokens', (table) => {
      table.uuid('id').primary().unique().notNullable()
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('token_hash', 64).notNullable().unique()
      table.timestamp('expires_at').notNullable()
      table.timestamp('used_at').nullable()
      table.timestamp('created_at').notNullable()
      table.index(['user_id', 'used_at'])
    })
  }

  async down() {
    this.schema.dropTable('email_verification_tokens')
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_verified_at')
    })
  }
}
