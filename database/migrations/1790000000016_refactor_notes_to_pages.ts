import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notes'

  async up() {
    // 1. New note_pages table (multi-page notes -> uploads)
    this.schema.createTable('note_pages', (table) => {
      table.uuid('id').primary().unique().notNullable()
      table.uuid('note_id').notNullable().references('id').inTable('notes').onDelete('CASCADE')
      table.uuid('upload_id').notNullable().references('id').inTable('uploads').onDelete('CASCADE')
      table.integer('sort_order').notNullable().defaultTo(0)

      table.unique(['note_id', 'sort_order'])
      table.unique(['note_id', 'upload_id'])
      table.index(['note_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    // 2. Refactor notes table: drop single-file columns, add lifecycle columns
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('file_key')
      table.dropColumn('file_size')
      table.dropColumn('mime_type')
      table.timestamp('provided_at').nullable()
      table.timestamp('archived_at').nullable()
    })

    // 3. Extend status enum with CONVERTED (postgres: drop default, widen, re-apply)
    this.schema.raw(`ALTER TABLE notes ALTER COLUMN status DROP DEFAULT`)
    this.schema.raw(`ALTER TABLE notes ALTER COLUMN status TYPE TEXT`)
    this.schema.alterTable(this.tableName, (table) => {
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
        .alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('provided_at')
      table.dropColumn('archived_at')
      table.string('file_key').notNullable()
      table.integer('file_size').nullable()
      table.string('mime_type').nullable()
    })
    this.schema.dropTableIfExists('note_pages')
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('status', ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'])
        .notNullable()
        .defaultTo('DRAFT')
        .alter()
    })
  }
}
