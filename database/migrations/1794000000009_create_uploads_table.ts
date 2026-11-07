import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'uploads'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()

      table.enum('type', ['image', 'document']).notNullable().index()
      table.string('title').notNullable().defaultTo('')
      table.string('description').nullable()
      table.string('url').unique().notNullable()
      table.string('mime_type').nullable()
      table.integer('size').nullable()
      table.json('metadata').notNullable()

      table.string('relative_key').notNullable().defaultTo('')
      table.string('created_by').nullable()
      table.index(['created_by'], 'uploads_created_by_index')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
