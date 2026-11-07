import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table
        .enum('note_type', ['LECTURE_NOTES', 'SUMMARY', 'REVISION', 'PAST_EXAM', 'EXERCISES'])
        .notNullable()
        .defaultTo('LECTURE_NOTES')
      table.integer('price').notNullable().defaultTo(0)
      table
        .enum('status', [
          'DRAFT',
          'CONVERTED',
          'PENDING_REVIEW',
          'PUBLISHED',
          'REJECTED',
          'ARCHIVED',
        ])
        .notNullable()
        .defaultTo('DRAFT')
        .index()
      table.uuid('uploaded_by').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('provided_at', { useTz: true }).nullable()
      table.timestamp('published_at').nullable()
      table.timestamp('archived_at', { useTz: true }).nullable()

      table.index(['course_id', 'status'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
