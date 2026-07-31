import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { generate as generateCpf } from 'gerador-validador-cpf';
import request, { type Response } from 'supertest';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { emailsCodes, users } from '@/infra/database/drizzle/schema';
import { assertSetupSucceeded } from './assert-response';

const DEFAULT_PASSWORD = 'MyS3cur3P@ssw0rd!';

export interface RecipientCredentials {
  email: string;
  cpf: string;
  password: string;
  accessToken: string;
}

export interface RegisterRecipientOptions {
  name?: string;
  cpf?: string;
  email?: string;
  password?: string;
}

export async function registerRecipientPerson(
  app: INestApplication,
  apiToken: string,
  options: RegisterRecipientOptions = {}
): Promise<{
  response: Response;
  email: string;
  cpf: string;
  password: string;
}> {
  const {
    name = 'Test Recipient',
    cpf = generateCpf(),
    email = `recipient-${randomUUID()}@example.com`,
    password = DEFAULT_PASSWORD,
  } = options;

  const response = await request(app.getHttpServer())
    .post('/recipients')
    .set('Authorization', `Bearer ${apiToken}`)
    .send({ name, cpf, email, password });

  return { response, email, cpf, password };
}

export async function sendRecipientCode(
  app: INestApplication,
  email: string,
  apiToken: string
): Promise<Response> {
  return request(app.getHttpServer())
    .post('/recipients/code')
    .set('Authorization', `Bearer ${apiToken}`)
    .send({ email });
}

export async function getRecipientEmailCode(
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

export async function validateRecipientCode(
  app: INestApplication,
  email: string,
  code: string,
  apiToken: string
): Promise<Response> {
  return request(app.getHttpServer())
    .put('/recipients/code')
    .set('Authorization', `Bearer ${apiToken}`)
    .send({ email, code });
}

export async function loginRecipientPerson(
  app: INestApplication,
  cpf: string,
  password: string,
  apiToken: string
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/recipients/login')
    .set('Authorization', `Bearer ${apiToken}`)
    .send({ cpf, password });

  assertSetupSucceeded(response, 'POST /recipients/login');

  const accessToken = response.body.access_token as string | undefined;

  if (!accessToken) {
    throw new Error(
      `[e2e setup] POST /recipients/login succeeded without an access_token: ${JSON.stringify(response.body)}`
    );
  }

  return accessToken;
}

export async function resetRecipientPersonPassword(
  app: INestApplication,
  accessToken: string,
  email: string,
  password: string,
  newPassword: string
): Promise<Response> {
  return request(app.getHttpServer())
    .patch('/recipients/reset-password')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ email, password, new_password: newPassword });
}

export async function updateRecipientPerson(
  app: INestApplication,
  accessToken: string,
  data: { name?: string; email?: string }
): Promise<Response> {
  return request(app.getHttpServer())
    .patch('/recipients')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(data);
}

export async function createAuthenticatedRecipientPerson(
  app: INestApplication,
  drizzleService: DrizzleService,
  apiToken: string,
  options: RegisterRecipientOptions = {}
): Promise<RecipientCredentials> {
  const { response, email, cpf, password } = await registerRecipientPerson(
    app,
    apiToken,
    options
  );

  assertSetupSucceeded(response, `POST /recipients (${email})`);

  assertSetupSucceeded(
    await sendRecipientCode(app, email, apiToken),
    `POST /recipients/code (${email})`
  );

  const code = await getRecipientEmailCode(drizzleService, email);

  assertSetupSucceeded(
    await validateRecipientCode(app, email, code, apiToken),
    `PUT /recipients/code (${email})`
  );

  const accessToken = await loginRecipientPerson(app, cpf, password, apiToken);

  return { email, cpf, password, accessToken };
}
