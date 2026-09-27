import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employees'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().unique().notNullable()
      table
        .uuid('university_id')
        .notNullable()
        .references('id')
        .inTable('universities')
        .onDelete('CASCADE')
      table
        .uuid('user_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
