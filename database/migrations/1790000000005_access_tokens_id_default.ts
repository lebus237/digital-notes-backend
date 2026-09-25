import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    await this.db.rawQuery(
      'alter table "auth_access_tokens" alter column "id" set default gen_random_uuid()'
    ).knexQuery
  }

  async down() {
    await this.db.rawQuery('alter table "auth_access_tokens" alter column "id" drop default')
      .knexQuery
  }
}
