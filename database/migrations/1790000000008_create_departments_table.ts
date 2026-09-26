import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'departments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().unique().notNullable()
      table
        .uuid('faculty_id')
        .notNullable()
        .references('id')
        .inTable('faculties')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('slug').notNullable()

      table.unique(['faculty_id', 'slug'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
