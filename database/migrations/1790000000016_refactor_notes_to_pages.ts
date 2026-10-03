import { BaseSchema } from '@adonisjs/lucid/schema'

const STATUS_WITH_CONVERTED = [
  'DRAFT',
  'CONVERTED',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED',
]
const STATUS_WITHOUT_CONVERTED = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED']

function checkInList(statuses: string[]) {
  return statuses.map((s) => `'${s}'`).join(', ')
}

/**
 * Knex implements enum() on Postgres as a text column + CHECK constraint,
 * and enum().alter() generates invalid SQL (CHECK inside ALTER COLUMN ..
 * TYPE .. USING). So the status check is swapped with raw SQL instead.
 *
 * All statements use IF EXISTS / IF NOT EXISTS so a re-run after a
 * partially applied attempt is safe.
 */
export default class extends BaseSchema {
  protected tableName = 'notes'

  private dropStatusCheckSql() {
    return `
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT con.conname AS name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = '${this.tableName}'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%IN%'
  LOOP
    EXECUTE format('ALTER TABLE ${this.tableName} DROP CONSTRAINT %I', c.name);
  END LOOP;
END $$;`
  }

  async up() {
    // 1. New note_pages table (multi-page notes -> uploads)
    this.schema.createTableIfNotExists('note_pages', (table) => {
      table.uuid('id').primary().unique().notNullable()
      table.uuid('note_id').notNullable().references('id').inTable('notes').onDelete('CASCADE')
      table.uuid('upload_id').notNullable().references('id').inTable('uploads').onDelete('CASCADE')
      table.integer('sort_order').notNullable().defaultTo(0)

      table.unique(['note_id', 'sort_order'])
      table.unique(['note_id', 'upload_id'])
      table.index(['note_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    // 2. Refactor notes table: drop single-file columns, add lifecycle columns
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP COLUMN IF EXISTS file_key`)
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP COLUMN IF EXISTS file_size`)
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP COLUMN IF EXISTS mime_type`)
    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD COLUMN IF NOT EXISTS provided_at timestamptz`
    )
    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD COLUMN IF NOT EXISTS archived_at timestamptz`
    )

    // 3. Extend status check with CONVERTED
    this.schema.raw(`ALTER TABLE ${this.tableName} ALTER COLUMN status DROP DEFAULT`)
    this.schema.raw(this.dropStatusCheckSql())
    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT notes_status_check CHECK (status IN (${checkInList(STATUS_WITH_CONVERTED)}))`
    )
    this.schema.raw(`ALTER TABLE ${this.tableName} ALTER COLUMN status SET DEFAULT 'DRAFT'`)
  }

  async down() {
    this.schema.raw(`ALTER TABLE ${this.tableName} ALTER COLUMN status DROP DEFAULT`)
    this.schema.raw(this.dropStatusCheckSql())
    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT notes_status_check CHECK (status IN (${checkInList(STATUS_WITHOUT_CONVERTED)}))`
    )
    this.schema.raw(`ALTER TABLE ${this.tableName} ALTER COLUMN status SET DEFAULT 'DRAFT'`)

    // Best-effort restore of single-file columns (data cannot be recovered).
    // Nullable so rollback succeeds on tables that already hold rows.
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP COLUMN IF EXISTS provided_at`)
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP COLUMN IF EXISTS archived_at`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN IF NOT EXISTS file_key varchar(255)`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN IF NOT EXISTS file_size integer`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN IF NOT EXISTS mime_type varchar(255)`)
    this.schema.dropTableIfExists('note_pages')
  }
}
