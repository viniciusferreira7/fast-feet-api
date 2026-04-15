import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { attachments } from './attachments';
import { users } from './users';

export const packageStatusEnum = pgEnum('package_status', [
  'pending',
  'awaiting_pickup',
  'picked_up',
  'at_distribution_center',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_delivery',
  'returned',
  'canceled',
]);

export const packages = pgTable(
  'packages',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    code: text('code').notNull().unique(),
    status: packageStatusEnum().notNull(),
    name: text('name').notNull(),
    postalCode: text('postal_code').notNull(),
    recipientAddress: text('recipient_address').notNull(),
    attachmentId: uuid('attachment_id')
      .unique()
      .references(() => attachments.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => sql`now()`
    ),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    version: integer('version').default(1).notNull(),

    recipientId: uuid('recipient_id')
      .notNull()
      .references(() => users.id),
    deliveryPersonId: uuid('delivery_id').references(() => users.id),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    index('package_recipient_id_idx').on(table.recipientId),
    index('package_delivery_id_idx').on(table.deliveryPersonId),
    index('package_status_idx').on(table.status),
  ]
);
