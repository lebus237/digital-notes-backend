import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Drops the legacy `image_medias` / `document_medias` tables. Their rows
 * were already copied into the unified table by the backfill migration
 * and nothing writes to them anymore. `down()` recreates the empty
 * schemas so a rollback does not crash.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.dropTableIfExists('image_medias')
    this.schema.dropTableIfExists('document_medias')
  }

  async down() {
    this.schema.createTable('image_medias', (table) => {
      table.uuid('id').primary().unique().notNullable()

      table.string('title').notNullable()
      table.string('alt_description').notNullable()
      table.string('url').unique().notNullable()
      table.json('metadata').notNullable()

      table.string('relative_key').notNullable().defaultTo('')
      table.string('created_by').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    this.schema.createTable('document_medias', (table) => {
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

    this.schema.alterTable('image_medias', (table) => {
      table.index(['created_by'], 'image_medias_created_by_index')
    })

    this.schema.alterTable('document_medias', (table) => {
      table.index(['created_by'], 'document_medias_created_by_index')
    })
  }
}
