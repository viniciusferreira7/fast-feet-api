import * as dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });
dotenv.config({ path: '.env.test', override: !process.env.CI });

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DomainEvents } from '@/core/events/domain-events';
import { envSchema } from '@/infra/env/env';

const env = envSchema.parse(process.env);

let cleanupPool: Pool;
let cleanupDb: ReturnType<typeof drizzle>;

beforeAll(() => {
  DomainEvents.shouldRun = false;

  cleanupPool = new Pool({ connectionString: env.DATABASE_URL });
  cleanupDb = drizzle(cleanupPool);
});

afterEach(async () => {
  await cleanupDb.execute(
    sql`TRUNCATE TABLE users, email_codes, attachments, delivery_profiles, notifications, package_histories, packages, recipient_profiles CASCADE`
  );
});

afterAll(async () => {
  await cleanupPool.end();
});
