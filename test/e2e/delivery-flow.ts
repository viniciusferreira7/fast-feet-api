import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { generate as generateCpf } from 'gerador-validador-cpf';
import request, { type Response } from 'supertest';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { emailsCodes, users } from '@/infra/database/drizzle/schema';
import { assertSetupSucceeded } from './assert-response';

const DEFAULT_PASSWORD = 'MyS3cur3P@ssw0rd!';

export interface DeliveryCredentials {
  email: string;
  cpf: string;
  password: string;
  accessToken: string;
}

export interface RegisterDeliveryOptions {
  name?: string;
  cpf?: string;
  email?: string;
  password?: string;
}

export async function registerDeliveryPerson(
  app: INestApplication,
  adminToken: string,
  options: RegisterDeliveryOptions = {}
): Promise<{
  response: Response;
  email: string;
  cpf: string;
  password: string;
}> {
  const {
    name = 'Test Delivery',
    cpf = generateCpf(),
    email = `delivery-${randomUUID()}@example.com`,
    password = DEFAULT_PASSWORD,
  } = options;

  const response = await request(app.getHttpServer())
    .post('/delivery-people')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name, cpf, email, password });

  return { response, email, cpf, password };
}

export async function sendDeliveryCode(
  app: INestApplication,
  email: string,
  apiToken: string
): Promise<Response> {
  return request(app.getHttpServer())
    .post('/delivery-people/code')
    .set('Authorization', `Bearer ${apiToken}`)
    .send({ email });
}

export async function getDeliveryEmailCode(
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

export async function validateDeliveryCode(
  app: INestApplication,
  email: string,
  code: string,
  apiToken: string
): Promise<Response> {
  return request(app.getHttpServer())
    .put('/delivery-people/code')
    .set('Authorization', `Bearer ${apiToken}`)
    .send({ email, code });
}

export async function loginDeliveryPerson(
  app: INestApplication,
  cpf: string,
  password: string,
  apiToken: string
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/delivery-people/login')
    .set('Authorization', `Bearer ${apiToken}`)
    .send({ cpf, password });

  assertSetupSucceeded(response, 'POST /delivery-people/login');

  const accessToken = response.body.access_token as string | undefined;

  if (!accessToken) {
    throw new Error(
      `[e2e setup] POST /delivery-people/login succeeded without an access_token: ${JSON.stringify(response.body)}`
    );
  }

  return accessToken;
}

export async function resetDeliveryPersonPassword(
  app: INestApplication,
  accessToken: string,
  email: string,
  password: string,
  newPassword: string
): Promise<Response> {
  return request(app.getHttpServer())
    .patch('/delivery-people/reset-password')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ email, password, new_password: newPassword });
}

export async function updateDeliveryPerson(
  app: INestApplication,
  accessToken: string,
  data: { name?: string; email?: string }
): Promise<Response> {
  return request(app.getHttpServer())
    .patch('/delivery-people')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(data);
}

export async function createAuthenticatedDeliveryPerson(
  app: INestApplication,
  drizzleService: DrizzleService,
  adminToken: string,
  apiToken: string,
  options: RegisterDeliveryOptions = {}
): Promise<DeliveryCredentials> {
  const { response, email, cpf, password } = await registerDeliveryPerson(
    app,
    adminToken,
    options
  );

  assertSetupSucceeded(response, `POST /delivery-people (${email})`);

  assertSetupSucceeded(
    await sendDeliveryCode(app, email, apiToken),
    `POST /delivery-people/code (${email})`
  );

  const code = await getDeliveryEmailCode(drizzleService, email);

  assertSetupSucceeded(
    await validateDeliveryCode(app, email, code, apiToken),
    `PUT /delivery-people/code (${email})`
  );

  const accessToken = await loginDeliveryPerson(app, cpf, password, apiToken);

  return { email, cpf, password, accessToken };
}
