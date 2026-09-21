import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Index ownership lookups. `created_by` stays nullable: legacy rows have no
 * owner and must remain deletable by an administrator until a backfill
 * strategy assigns them.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('medias', (table) => {
      table.index(['created_by'], 'medias_created_by_index')
    })

    this.schema.alterTable('image_medias', (table) => {
      table.index(['created_by'], 'image_medias_created_by_index')
    })

    this.schema.alterTable('document_medias', (table) => {
      table.index(['created_by'], 'document_medias_created_by_index')
    })
  }

  async down() {
    this.schema.alterTable('medias', (table) => {
      table.dropIndex(['created_by'], 'medias_created_by_index')
    })

    this.schema.alterTable('image_medias', (table) => {
      table.dropIndex(['created_by'], 'image_medias_created_by_index')
    })

    this.schema.alterTable('document_medias', (table) => {
      table.dropIndex(['created_by'], 'document_medias_created_by_index')
    })
  }
}
