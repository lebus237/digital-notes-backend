import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'semesters'

  async up() {
    this.defer(async () => {
      await this.db.rawQuery(`
        UPDATE ${this.tableName}
        SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
            updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
        WHERE created_at IS NULL OR updated_at IS NULL
      `)
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('created_at').notNullable().defaultTo(this.now()).alter()
      table.timestamp('updated_at').notNullable().defaultTo(this.now()).alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('created_at').nullable().defaultTo(null).alter()
      table.timestamp('updated_at').nullable().defaultTo(null).alter()
    })
  }
}
