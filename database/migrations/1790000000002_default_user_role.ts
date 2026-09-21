import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.raw(`ALTER TABLE ${this.tableName} ALTER COLUMN role SET DEFAULT 'student'`)
  }

  async down() {
    this.schema.raw(`ALTER TABLE ${this.tableName} ALTER COLUMN role DROP DEFAULT`)
  }
}
