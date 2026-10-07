import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const adminOwners = sqliteTable('admin_owners', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  reason: text('reason').notNull(),
  availability: text('availability').notNull().default(''),
  status: text('status').notNull().default('new'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const team = sqliteTable('team', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  role: text('role').notNull(),
  bio: text('bio').notNull().default(''),
  order: integer('sort_order').notNull().default(0),
});
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
