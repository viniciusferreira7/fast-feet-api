import { boolean, index, integer, pgTable, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const deliveryProfiles = pgTable(
  'delivery_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),
    isActive: boolean('is_active').notNull().default(true),
    version: integer('version').default(1).notNull(),
  },
  (table) => [index('delivery_profile_is_active_idx').on(table.isActive)]
);
