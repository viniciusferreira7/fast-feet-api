import { execSync } from 'node:child_process';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DomainEvents } from '@/core/events/domain-events';
import { envSchema } from '@/infra/env/env';

dotenv.config({ path: '.env', override: true });
dotenv.config({ path: '.env.test', override: !process.env.CI });

const env = envSchema.parse(process.env);

let cleanupPool: Pool;
let cleanupDb: ReturnType<typeof drizzle>;

beforeAll(async () => {
  DomainEvents.shouldRun = false;

  cleanupPool = new Pool({ connectionString: env.DATABASE_URL });
  cleanupDb = drizzle(cleanupPool);

  try {
    execSync('pnpm db:push:force', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to push database schema:', error);
    throw error;
  }
});

afterEach(async () => {
  await cleanupDb.execute(
    sql`TRUNCATE TABLE users, email_codes, attachments, delivery_profiles, notifications, package_histories, packages, recipient_profiles CASCADE`
  );
});

afterAll(async () => {
  await cleanupPool.end();
});
