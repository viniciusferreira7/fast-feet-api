import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { packageStatusEnum, packages } from './packages';
import { users } from './users';

export const packageHistories = pgTable(
  'package_histories',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    description: varchar('description', { length: 600 }),
    fromStatus: packageStatusEnum('from_status'),
    toStatus: packageStatusEnum('to_status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    version: integer('version').default(1).notNull(),

    deliveryPersonId: uuid('delivery_id').references(() => users.id),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    packageId: uuid('package_id').references(() => packages.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => [
    index('package_history_package_id_idx').on(table.packageId),
    index('package_history_delivery_id_idx').on(table.deliveryPersonId),
  ]
);
