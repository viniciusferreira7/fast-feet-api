import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const emailsCodes = pgTable('email_codes', {
  id: uuid('id').primaryKey(),
  code: text('code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
});
