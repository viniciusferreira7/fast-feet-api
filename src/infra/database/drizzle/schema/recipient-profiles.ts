import { integer, pgTable, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const recipientProfiles = pgTable('recipient_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),
  version: integer('version').default(1).notNull(),
});
