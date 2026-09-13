import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().unique().notNullable()
      table.enum('role', ['student', 'administrator', 'contributor']).notNullable()
      table.string('full_name').nullable()
      table.string('email', 254).unique()
      table.string('phone_number', 12).notNullable().unique()
      table.string('password_hash').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
