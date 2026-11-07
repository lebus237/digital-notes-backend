import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'note_pages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.uuid('note_id').notNullable().references('id').inTable('notes').onDelete('CASCADE')
      table.uuid('upload_id').notNullable().references('id').inTable('uploads').onDelete('CASCADE')
      table.integer('sort_order').notNullable().defaultTo(0)

      table.unique(['note_id', 'sort_order'])
      table.unique(['note_id', 'upload_id'])
      table.index(['note_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
