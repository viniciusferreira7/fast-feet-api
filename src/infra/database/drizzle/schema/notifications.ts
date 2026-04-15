import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    title: varchar('title', { length: 255 }).notNull(),
    content: varchar('content', { length: 600 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    version: integer('version').default(1).notNull(),

    recipientId: uuid('recipient_id')
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    index('notification_recipient_id_idx').on(table.recipientId),
    index('notification_recipient_unread_idx').on(
      table.recipientId,
      table.readAt
    ),
  ]
);
