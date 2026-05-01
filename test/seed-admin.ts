import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from '@/infra/database/drizzle/schema';
import { envSchema } from '@/infra/env/env';

dotenv.config({ path: '.env', override: true });
dotenv.config({ path: '.env.test', override: !process.env.CI });

const env = envSchema.parse(process.env);

let seedPool: Pool;
let seedDb: ReturnType<typeof drizzle>;
let hashedPassword: string;

beforeAll(async () => {
  seedPool = new Pool({ connectionString: env.DATABASE_URL });
  seedDb = drizzle(seedPool);

  hashedPassword = await argon2.hash(env.ADMIN_ROOT_PASSWORD, {
    type: argon2.argon2id,
    secret: Buffer.from(env.ARGON2_PEPPER),
    memoryCost: 2 ** 16,
    timeCost: 5,
    parallelism: 3,
  });
});

beforeEach(async () => {
  await seedDb
    .insert(users)
    .values({
      name: 'Root Admin',
      cpf: env.ADMIN_ROOT_CPF,
      email: env.ADMIN_ROOT_EMAIL,
      password: hashedPassword,
      role: 'ADMIN',
      version: 1,
    })
    .onConflictDoNothing();
});

afterAll(async () => {
  await seedPool.end();
});
