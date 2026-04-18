import { execSync } from 'node:child_process';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
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

  const connectionString = env.DATABASE_URL;

  cleanupPool = new Pool({ connectionString });
  cleanupDb = drizzle(cleanupPool);

  if (process.env.CI) {
    await migrate(cleanupDb, {
      migrationsFolder: 'src/infra/database/drizzle/migrations',
    });
  } else {
    execSync('pnpm db:push:force', { stdio: 'inherit' });
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
