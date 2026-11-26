import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('pending'),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  is_private: boolean('is_private').default(false),
  created_at: timestamp('created_at').defaultNow(),
});

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  task_id: integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});