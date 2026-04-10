import * as dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });
dotenv.config({ path: '.env.test', override: true });

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DomainEvents } from '@/core/events/domain-events';
import { envSchema } from '@/infra/env/env';

const env = envSchema.parse(process.env);

let pool: Pool;

function generateUniqueDatabaseURL(schemaId: string) {
  const url = new URL(env.DATABASE_URL);

  url.searchParams.set('schema', schemaId);
  url.searchParams.set('connect_timeout', '1000');

  return url.toString();
}

const schemaId = randomUUID();

beforeAll(async () => {
  const databaseUrl = generateUniqueDatabaseURL(schemaId);

  process.env.DATABASE_URL = databaseUrl;

  DomainEvents.shouldRun = false;

  execSync('pnpm drizzle-kit migrate');

  pool = new Pool({ connectionString: databaseUrl });
});

afterAll(async () => {
  const db = drizzle(pool);

  await db.execute(sql.raw(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`));

  await pool.end();
});
