import * as dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });
dotenv.config({ path: '.env.test', override: true });

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { DomainEvents } from '@/core/events/domain-events';
import { envSchema } from '@/infra/env/env';

const env = envSchema.parse(process.env);
const schemaId = randomUUID();
const dbName = new URL(env.DATABASE_URL).pathname.slice(1);

beforeAll(async () => {
  DomainEvents.shouldRun = false;

  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaId}"`);
  await client.query(
    `ALTER DATABASE "${dbName}" SET search_path TO "${schemaId}"`
  );
  await client.end();

  process.env.DATABASE_URL = `${env.DATABASE_URL}?schema=${schemaId}`;
  execSync('pnpm db:migrate');
});

afterAll(async () => {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  await client.query(`ALTER DATABASE "${dbName}" RESET search_path`);
  await client.query(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`);
  await client.end();

  // await dropUUIDSchemas(env.DATABASE_URL); This is used to delete unused schemas
});
