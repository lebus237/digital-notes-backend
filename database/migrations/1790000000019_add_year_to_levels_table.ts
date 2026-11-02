import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Standardises levels on a numeric `year` (1, 2, 3, ...) as the source of
 * truth for identity, ordering and filtering. `name` stays as the display
 * label, so institutions keep their own wording ("100 Level", "Year One").
 *
 * Backfill: leading digits in the name map to a year (100 -> 1, 200 -> 2,
 * plain 1-12 used as-is). Rows that cannot be parsed, or that would collide
 * on (department_id, year), keep the earliest-created row per year and get
 * sequential years after the department maximum. Admins should verify the
 * resulting years for pre-existing rows.
 */
export default class extends BaseSchema {
  protected tableName = 'levels'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.integer('year').nullable()
    })

    await this.db.rawQuery(
      `UPDATE levels SET year = CASE
        WHEN v BETWEEN 1 AND 12 THEN v
        WHEN v % 100 = 0 AND v BETWEEN 100 AND 1200 THEN v / 100
        ELSE NULL
      END
      FROM (
        SELECT id, (regexp_match(name, '^([0-9]+)'))[1]::int AS v FROM levels
      ) AS parsed
      WHERE levels.id = parsed.id AND levels.year IS NULL`
    )

    await this.db.rawQuery(
      `UPDATE levels l SET year = NULL
      WHERE l.year IS NOT NULL AND EXISTS (
        SELECT 1 FROM levels o
        WHERE o.department_id = l.department_id
          AND o.year = l.year
          AND (COALESCE(o.created_at, '-infinity'), o.id) < (COALESCE(l.created_at, '-infinity'), l.id)
      )`
    )

    await this.db.rawQuery(
      `WITH maxes AS (
        SELECT department_id, COALESCE(MAX(year), 0) AS m FROM levels GROUP BY department_id
      ),
      ranked AS (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY department_id ORDER BY created_at NULLS LAST, id
        ) AS rn FROM levels WHERE year IS NULL
      )
      UPDATE levels SET year = maxes.m + ranked.rn
      FROM maxes, ranked
      WHERE levels.id = ranked.id AND levels.department_id = maxes.department_id`
    )

    await this.schema.alterTable(this.tableName, (table) => {
      table.integer('year').notNullable().alter()
      table.dropUnique(['department_id', 'name'])
      table.unique(['department_id', 'year'])
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['department_id', 'year'])
      table.dropColumn('year')
      table.unique(['department_id', 'name'])
    })
  }
}
