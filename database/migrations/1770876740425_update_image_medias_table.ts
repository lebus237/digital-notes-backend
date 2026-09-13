import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'image_medias'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('relative_key').notNullable().defaultTo('')
    })
  }

  async down() {}
}
