import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import {
  createAuthenticatedAdmin,
  getAdminEmailCode,
  loginAdmin,
  registerAdmin,
  resetAdminPassword,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

const STRONG_PASSWORD = 'MyS3cur3P@ssw0rd!';
const NEW_STRONG_PASSWORD = 'N3wS3cur3P@ssw0rd!';

describe('Reset Admin Person Password (E2E)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let rootAdminId: string;
  let rootAdminToken: string;
  let apiToken: string;

  beforeAll(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    jwt = moduleRef.get(JwtService);
    drizzleService = moduleRef.get(DrizzleService);
    envService = moduleRef.get(EnvService);
  });

  beforeEach(async () => {
    const rootEmail = envService.get('ADMIN_ROOT_EMAIL');
    apiToken = envService.get('CLIENT_API_KEY') ?? '';

    const [admin] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, rootEmail));

    rootAdminId = admin.id;

    await sendAdminCode(app, rootEmail, apiToken);
    const code = await getAdminEmailCode(drizzleService, rootEmail);
    await validateAdminCode(app, rootEmail, code, apiToken);
    rootAdminToken = await loginAdmin(
      app,
      envService.get('ADMIN_ROOT_CPF'),
      envService.get('ADMIN_ROOT_PASSWORD'),
      apiToken
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('[PATCH] /admins/reset-password — should reset password and return 204', async () => {
    const { email, password } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await resetAdminPassword(
      app,
      rootAdminToken,
      email,
      password,
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(204);
  });

  it('[PATCH] /admins/reset-password — should return 400 when password is wrong', async () => {
    const { email } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await resetAdminPassword(
      app,
      rootAdminToken,
      email,
      'Wr0ngP@ssw0rd!',
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /admins/reset-password — should return 400 when email is not found', async () => {
    const response = await resetAdminPassword(
      app,
      rootAdminToken,
      'nonexistent@example.com',
      STRONG_PASSWORD,
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /admins/reset-password — should return 400 when email code has not been verified', async () => {
    const { email, password } = await registerAdmin(app, rootAdminToken);

    const response = await resetAdminPassword(
      app,
      rootAdminToken,
      email,
      password,
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /admins/reset-password — should return 400 when new password is weak', async () => {
    const { email, password } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await resetAdminPassword(
      app,
      rootAdminToken,
      email,
      password,
      'weak'
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /admins/reset-password — should return 403 when requester is not an admin', async () => {
    const deliveryToken = jwt.sign({
      type: 'user',
      sub: rootAdminId,
      role: 'delivery',
    });

    const response = await request(app.getHttpServer())
      .patch('/admins/reset-password')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({
        email: 'some@example.com',
        password: STRONG_PASSWORD,
        newPassword: NEW_STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /admins/reset-password — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .patch('/admins/reset-password')
      .send({
        email: 'some@example.com',
        password: STRONG_PASSWORD,
        newPassword: NEW_STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(401);
  });

  it('[PATCH] /admins/reset-password — should return 400 for invalid email format', async () => {
    const response = await request(app.getHttpServer())
      .patch('/admins/reset-password')
      .set('Authorization', `Bearer ${rootAdminToken}`)
      .send({
        email: 'not-an-email',
        password: STRONG_PASSWORD,
        newPassword: NEW_STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(400);
  });
});
