import { type INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { generate as generateCpf } from 'gerador-validador-cpf';
import request, { type Response } from 'supertest';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { emailsCodes, users } from '@/infra/database/drizzle/schema';

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
    email = `admin-${Date.now()}@example.com`,
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

  if (!user.emailCode) throw new Error(`No email code found for ${email}`);

  const [row] = await drizzleService.db
    .select()
    .from(emailsCodes)
    .where(eq(emailsCodes.id, user.emailCode));

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

  return response.body.access_token as string;
}

export async function createAuthenticatedAdmin(
  app: INestApplication,
  drizzleService: DrizzleService,
  adminToken: string,
  apiToken: string,
  options: RegisterAdminOptions = {}
): Promise<AdminCredentials> {
  const { email, cpf, password } = await registerAdmin(
    app,
    adminToken,
    options
  );

  await sendAdminCode(app, email, apiToken);

  const code = await getAdminEmailCode(drizzleService, email);

  await validateAdminCode(app, email, code, apiToken);

  const accessToken = await loginAdmin(app, cpf, password, apiToken);

  return { email, cpf, password, accessToken };
}
