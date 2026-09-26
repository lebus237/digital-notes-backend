import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'courses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().unique().notNullable()
      table
        .uuid('department_id')
        .notNullable()
        .references('id')
        .inTable('departments')
        .onDelete('CASCADE')
      table.uuid('level_id').notNullable().references('id').inTable('levels').onDelete('RESTRICT')
      table
        .uuid('semester_id')
        .notNullable()
        .references('id')
        .inTable('semesters')
        .onDelete('RESTRICT')
      table.string('code').notNullable()
      table.string('name').notNullable()
      table.text('description').nullable()
      table.boolean('is_archived').notNullable().defaultTo(false)

      table.unique(['department_id', 'level_id', 'semester_id', 'code'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
