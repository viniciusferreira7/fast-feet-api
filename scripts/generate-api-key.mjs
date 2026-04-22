import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const jwt = require('../node_modules/.pnpm/jsonwebtoken@9.0.3/node_modules/jsonwebtoken/index.js');

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, '../.env');
const envLines = readFileSync(envPath, 'utf8').split('\n');

function getEnvVar(key) {
  const line = envLines.find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`Missing env var: ${key}`);
  return line.slice(key.length + 1).trim();
}

const privateKeyBase64 = getEnvVar('JWT_PRIVATE_KEY');
const privateKeyPem = Buffer.from(privateKeyBase64, 'base64').toString('utf8');

const SIX_MONTHS_IN_SECONDS = 60 * 60 * 24 * 30 * 6;

const token = jwt.sign(
  { type: 'api-key', service: 'client' },
  privateKeyPem,
  { algorithm: 'RS256', expiresIn: SIX_MONTHS_IN_SECONDS },
);

const exp = new Date(Date.now() + SIX_MONTHS_IN_SECONDS * 1000);

console.log('\nAPI Key (JWT) — valid until', exp.toISOString());
console.log('\n' + token + '\n');
