import * as dotenv from 'dotenv';
import { execSync } from 'node:child_process';

dotenv.config({ path: '.env', override: true });
dotenv.config({ path: '.env.test', override: !process.env.CI });

export async function setup() {
  execSync('pnpm db:push:force', { stdio: 'inherit' });
}
