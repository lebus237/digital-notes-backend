import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_medias'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().unique().notNullable()

      table.string('title').notNullable()
      table.string('description').notNullable()
      table.string('url').unique().notNullable()
      table.json('metadata').notNullable()

      table.string('relative_key').notNullable().defaultTo('')
      table.string('created_by').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
