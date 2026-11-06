import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('university_id').nullable().references('id').inTable('universities').onDelete('SET NULL')
      table.uuid('faculty_id').nullable().references('id').inTable('faculties').onDelete('SET NULL')
      table
        .uuid('department_id')
        .nullable()
        .references('id')
        .inTable('departments')
        .onDelete('SET NULL')
      table.uuid('level_id').nullable().references('id').inTable('levels').onDelete('SET NULL')
      table.uuid('semester_id').nullable().references('id').inTable('semesters').onDelete('SET NULL')

      table.index(['university_id'])
      table.index(['department_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('university_id')
      table.dropColumn('faculty_id')
      table.dropColumn('department_id')
      table.dropColumn('level_id')
      table.dropColumn('semester_id')
    })
  }
}
