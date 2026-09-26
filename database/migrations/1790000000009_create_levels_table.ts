import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'levels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().unique().notNullable()
      table
        .uuid('department_id')
        .notNullable()
        .references('id')
        .inTable('departments')
        .onDelete('CASCADE')
      table.string('name').notNullable()

      table.unique(['department_id', 'name'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
