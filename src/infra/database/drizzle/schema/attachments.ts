import { sql } from 'drizzle-orm';
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { packages } from './packages';

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    title: text('title'),
    url: text('text').notNull().unique(),
    packageId: uuid('package_id').references(() => packages.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => [index('package_id_idx').on(table.packageId)]
);
