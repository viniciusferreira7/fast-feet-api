import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { emailsCodes } from './email-codes';

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'DELIVERY',
  'RECIPIENT',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    cpf: text('cpf').notNull().unique(),
    email: text('email').notNull().unique(),
    role: userRoleEnum().notNull(),
    password: text('password').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => sql`now()`
    ),
    version: integer('version').default(1).notNull(),

    emailCode: uuid('email_code').references(() => emailsCodes.id),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  },
  (table) => [
    check('cpf_numeric_check', sql`${table.cpf} ~ '^[0-9]{11}$'`),
    index('role_idx').on(table.role),
  ]
);
