import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

dotenv.config({ path: '.env', override: true });
dotenv.config({ path: '.env.test', override: !process.env.CI });

export async function setup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  await migrate(db, {
    migrationsFolder: 'src/infra/database/drizzle/migrations',
  });
  await pool.end();
}
