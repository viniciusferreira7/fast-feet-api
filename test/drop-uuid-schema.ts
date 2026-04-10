import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import z from 'zod';

function isUUID(str: string): boolean {
  const result = z.object({ str: z.string().uuid() }).safeParse({ str });

  return result.success;
}

export async function dropUUIDSchemas(connectionString: string) {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  const result = await db.execute<{ schema_name: string }>(
    sql`SELECT schema_name FROM information_schema.schemata`
  );

  const IGNORED_SCHEMAS = ['pg_catalog', 'information_schema', 'public'];

  const uuidSchemas = result.rows
    .map(({ schema_name }) => schema_name)
    .filter((name) => isUUID(name) && !IGNORED_SCHEMAS.includes(name));

  for (const schema of uuidSchemas) {
    console.log(`Dropping schema: ${schema}`);
    await db.execute(sql.raw(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`));
  }

  const userSchemas = await db.execute<{ schema_name: string }>(
    sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema')`
  );

  console.log({ userSchemas: userSchemas.rows });

  await pool.end();
}
