import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Forward-only data migration: copies existing rows from the legacy
 * `image_medias` / `document_medias` tables into the unified `medias` table.
 *
 * `mime_type` / `size` are recovered from the `metadata` JSON with null
 * fallbacks for rows where the metadata is incomplete. The legacy tables
 * are left untouched so the old endpoints keep working until cleanup.
 */
export default class extends BaseSchema {
  async up() {
    const existingRows = await this.db.from('medias').select('id')
    const existingIds = new Set(existingRows.map((row: any) => row.id))

    const images = await this.db.from('image_medias').select('*')
    for (const image of images) {
      if (existingIds.has(image.id)) {
        continue
      }
      const metadata = image.metadata ?? {}
      await this.db.table('medias').insert({
        id: image.id,
        type: 'image',
        title: image.title ?? '',
        description: image.alt_description ?? null,
        url: image.url,
        mime_type: metadata.mimeType ?? metadata.mime_type ?? null,
        size: metadata.size ?? null,
        metadata,
        relative_key: image.relative_key ?? '',
        created_by: image.created_by ?? null,
        created_at: image.created_at ?? new Date(),
        updated_at: image.updated_at ?? new Date(),
      })
      existingIds.add(image.id)
    }

    const documents = await this.db.from('document_medias').select('*')
    for (const document of documents) {
      if (existingIds.has(document.id)) {
        continue
      }
      const metadata = document.metadata ?? {}
      await this.db.table('medias').insert({
        id: document.id,
        type: 'document',
        title: document.title ?? '',
        description: document.description ?? null,
        url: document.url,
        mime_type: metadata.mimeType ?? metadata.mime_type ?? null,
        size: metadata.size ?? null,
        metadata,
        relative_key: document.relative_key ?? '',
        created_by: document.created_by ?? null,
        created_at: document.created_at ?? new Date(),
        updated_at: document.updated_at ?? new Date(),
      })
      existingIds.add(document.id)
    }
  }

  async down() {
    // Forward-only: rolling back intentionally leaves backfilled rows in place
    // so no user data is destroyed. Drop the `medias` table instead by
    // rolling back the create-table migration.
  }
}
