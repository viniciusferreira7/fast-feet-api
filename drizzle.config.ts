import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { envSchema } from '@/infra/env/env';

const env = envSchema.parse(process.env);

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schema: 'src/infra/database/drizzle/schema/*',
  out: 'src/infra/database/drizzle/migrations',
  casing: 'snake_case',
});
