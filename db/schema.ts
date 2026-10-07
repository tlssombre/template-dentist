import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
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
  scheduledDate: text('scheduled_date'),
  slotTime: text('slot_time'),
  status: text('status').notNull().default('new'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [uniqueIndex('appointments_confirmed_slot_unique').on(table.scheduledDate,table.slotTime).where(sql`status IN ('confirmed','completed') AND scheduled_date IS NOT NULL AND slot_time IS NOT NULL`)]);
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
export const weeklyHours = sqliteTable('weekly_hours', {
  weekday: integer('weekday').primaryKey(),
  isOpen: integer('is_open').notNull().default(1),
  startTime: text('start_time').notNull().default('09:00'),
  endTime: text('end_time').notNull().default('17:00'),
});
export const calendarBlocks = sqliteTable('calendar_blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  time: text('time').notNull(),
  note: text('note').notNull().default(''),
}, table => [uniqueIndex('calendar_blocks_date_time_unique').on(table.date,table.time)]);
export const staffAccounts = sqliteTable('staff_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(),
  active: integer('active').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const beforeAfterCases = sqliteTable('before_after_cases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  treatment: text('treatment').notNull().default(''),
  imageUrl: text('image_url').notNull(),
  afterOnTop: integer('after_on_top').notNull().default(1),
  visible: integer('visible').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
});
