import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().unique().notNullable()
      table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('file_key').notNullable()
      table.integer('file_size').nullable()
      table.string('mime_type').nullable()
      table
        .enum('note_type', ['LECTURE_NOTES', 'SUMMARY', 'REVISION', 'PAST_EXAM', 'EXERCISES'])
        .notNullable()
        .defaultTo('LECTURE_NOTES')
      table.integer('price').notNullable().defaultTo(0)
      table
        .enum('status', ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'])
        .notNullable()
        .defaultTo('DRAFT')
        .index()
      table.uuid('uploaded_by').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('published_at').nullable()

      table.index(['course_id', 'status'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
