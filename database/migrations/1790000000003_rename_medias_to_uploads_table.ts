import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Renames the unified `medias` table to `uploads` and re-creates the
 * ownership index with the matching name. The `type` enum index and the
 * `url` unique constraint carry over automatically with the rename.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.renameTable('medias', 'uploads')

    this.schema.alterTable('uploads', (table) => {
      table.dropIndex(['created_by'], 'medias_created_by_index')
      table.index(['created_by'], 'uploads_created_by_index')
    })
  }

  async down() {
    this.schema.alterTable('medias', (table) => {
      table.dropIndex(['created_by'], 'uploads_created_by_index')
      table.index(['created_by'], 'medias_created_by_index')
    })

    this.schema.renameTable('uploads', 'medias')
  }
}
