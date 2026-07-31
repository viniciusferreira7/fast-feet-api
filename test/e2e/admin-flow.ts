import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { generate as generateCpf } from 'gerador-validador-cpf';
import request, { type Response } from 'supertest';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { emailsCodes, users } from '@/infra/database/drizzle/schema';
import { assertSetupSucceeded } from './assert-response';

const DEFAULT_PASSWORD = 'MyS3cur3P@ssw0rd!';

export interface AdminCredentials {
  email: string;
  cpf: string;
  password: string;
  accessToken: string;
}

export interface RegisterAdminOptions {
  name?: string;
  cpf?: string;
  email?: string;
  password?: string;
}

export async function registerAdmin(
  app: INestApplication,
  adminToken: string,
  options: RegisterAdminOptions = {}
): Promise<{
  response: Response;
  email: string;
  cpf: string;
  password: string;
}> {
  const {
    name = 'Test Admin',
    cpf = generateCpf(),
    email = `admin-${randomUUID()}@example.com`,
    password = DEFAULT_PASSWORD,
  } = options;

  const response = await request(app.getHttpServer())
    .post('/admins')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name, cpf, email, password });

  return { response, email, cpf, password };
}

export async function sendAdminCode(
  app: INestApplication,
  email: string,
  apiToken: string
): Promise<Response> {
  const res = await request(app.getHttpServer())
    .post('/admins/code')
    .set('Authorization', `Bearer ${apiToken}`)
    .send({ email });

  return res;
}

export async function getAdminEmailCode(
  drizzleService: DrizzleService,
  email: string
): Promise<string> {
  const [user] = await drizzleService.db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (!user) {
    throw new Error(`[e2e setup] no user row for ${email}`);
  }

  if (!user.emailCode) {
    throw new Error(
      `[e2e setup] no email code for ${email} (role=${user.role}, emailVerifiedAt=${user.emailVerifiedAt?.toISOString() ?? 'null'}) — the code request did not persist one`
    );
  }

  const [row] = await drizzleService.db
    .select()
    .from(emailsCodes)
    .where(eq(emailsCodes.id, user.emailCode));

  if (!row) {
    throw new Error(
      `[e2e setup] ${email} points at email code ${user.emailCode}, but that row is missing`
    );
  }

  return row.code;
}

export async function validateAdminCode(
  app: INestApplication,
  email: string,
  code: string,
  apiToken: string
): Promise<Response> {
  const res = await request(app.getHttpServer())
    .put('/admins/code')
    .set('Authorization', `Bearer ${apiToken}`)
    .send({ email, code });

  return res;
}

export async function loginAdmin(
  app: INestApplication,
  cpf: string,
  password: string,
  apiToken: string
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/admins/login')
    .set('Authorization', `Bearer ${apiToken}`)
    .send({ cpf, password });

  assertSetupSucceeded(response, 'POST /admins/login');

  const accessToken = response.body.access_token as string | undefined;

  if (!accessToken) {
    throw new Error(
      `[e2e setup] POST /admins/login succeeded without an access_token: ${JSON.stringify(response.body)}`
    );
  }

  return accessToken;
}

export async function resetAdminPassword(
  app: INestApplication,
  accessToken: string,
  email: string,
  password: string,
  newPassword: string
): Promise<Response> {
  return request(app.getHttpServer())
    .patch('/admins/reset-password')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ email, password, newPassword });
}

export async function updateAdmin(
  app: INestApplication,
  accessToken: string,
  data: { name?: string; email?: string }
): Promise<Response> {
  return request(app.getHttpServer())
    .patch('/admins')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(data);
}

export async function createAuthenticatedAdmin(
  app: INestApplication,
  drizzleService: DrizzleService,
  adminToken: string,
  apiToken: string,
  options: RegisterAdminOptions = {}
): Promise<AdminCredentials> {
  const { response, email, cpf, password } = await registerAdmin(
    app,
    adminToken,
    options
  );

  assertSetupSucceeded(response, `POST /admins (${email})`);

  assertSetupSucceeded(
    await sendAdminCode(app, email, apiToken),
    `POST /admins/code (${email})`
  );

  const code = await getAdminEmailCode(drizzleService, email);

  assertSetupSucceeded(
    await validateAdminCode(app, email, code, apiToken),
    `PUT /admins/code (${email})`
  );

  const accessToken = await loginAdmin(app, cpf, password, apiToken);

  return { email, cpf, password, accessToken };
}
