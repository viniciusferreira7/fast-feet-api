import { type INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { generate as generateCpf } from 'gerador-validador-cpf';
import request, { type Response } from 'supertest';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { emailsCodes, users } from '@/infra/database/drizzle/schema';

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
    email = `delivery-${Date.now()}@example.com`,
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

  if (!user.emailCode) throw new Error(`No email code found for ${email}`);

  const [row] = await drizzleService.db
    .select()
    .from(emailsCodes)
    .where(eq(emailsCodes.id, user.emailCode));

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

  return response.body.access_token as string;
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
  const { email, cpf, password } = await registerDeliveryPerson(
    app,
    adminToken,
    options
  );

  await sendDeliveryCode(app, email, apiToken);

  const code = await getDeliveryEmailCode(drizzleService, email);

  await validateDeliveryCode(app, email, code, apiToken);

  const accessToken = await loginDeliveryPerson(app, cpf, password, apiToken);

  return { email, cpf, password, accessToken };
}
