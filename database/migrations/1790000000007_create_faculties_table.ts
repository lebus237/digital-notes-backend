import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'faculties'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().unique().notNullable()
      table.uuid('university_id').notNullable().references('id').inTable('universities').onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('slug').notNullable()

      table.unique(['university_id', 'slug'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
