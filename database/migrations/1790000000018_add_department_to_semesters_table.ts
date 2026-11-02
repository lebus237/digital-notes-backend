import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'semesters'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('department_id')
        .notNullable()
        .references('id')
        .inTable('departments')
        .onDelete('CASCADE')
      table.dropUnique(['name'])
      table.unique(['department_id', 'name'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['department_id', 'name'])
      table.dropColumn('department_id')
      table.unique(['name'])
    })
  }
}
