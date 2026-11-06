import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('note_favorites', (table) => {
      table.uuid('id').primary().unique().notNullable()
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .uuid('note_id')
        .notNullable()
        .references('id')
        .inTable('notes')
        .onDelete('CASCADE')
      table.timestamp('created_at').notNullable()
      table.unique(['user_id', 'note_id'])
      table.index(['user_id', 'created_at'])
    })

    this.schema.createTable('note_views', (table) => {
      table.uuid('id').primary().unique().notNullable()
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .uuid('note_id')
        .notNullable()
        .references('id')
        .inTable('notes')
        .onDelete('CASCADE')
      table.timestamp('viewed_at').notNullable()
      table.unique(['user_id', 'note_id'])
      table.index(['user_id', 'viewed_at'])
    })
  }

  async down() {
    this.schema.dropTable('note_views')
    this.schema.dropTable('note_favorites')
  }
}
