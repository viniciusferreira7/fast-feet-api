import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import {
  createAuthenticatedDeliveryPerson,
  registerDeliveryPerson,
  resetDeliveryPersonPassword,
} from 'test/e2e/delivery-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

const STRONG_PASSWORD = 'MyS3cur3P@ssw0rd!';
const NEW_STRONG_PASSWORD = 'N3wS3cur3P@ssw0rd!';

describe('Reset Delivery Person Password (E2E)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let drizzleService: DrizzleService;
  let envService: EnvService;
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

  it('[PATCH] /delivery-people/reset-password — should reset password and return 204', async () => {
    const { email, password, accessToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        rootAdminToken,
        apiToken
      );

    const response = await resetDeliveryPersonPassword(
      app,
      accessToken,
      email,
      password,
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(204);
  });

  it('[PATCH] /delivery-people/reset-password — should return 400 when password is wrong', async () => {
    const { email, accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await resetDeliveryPersonPassword(
      app,
      accessToken,
      email,
      'Wr0ngP@ssw0rd!',
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /delivery-people/reset-password — should return 400 when email is not found', async () => {
    const { accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await resetDeliveryPersonPassword(
      app,
      accessToken,
      'nonexistent@example.com',
      STRONG_PASSWORD,
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /delivery-people/reset-password — should return 400 when email code has not been verified', async () => {
    const { email, password } = await registerDeliveryPerson(
      app,
      rootAdminToken
    );

    const ghostToken = jwt.sign({
      type: 'user',
      sub: 'fake-id',
      role: 'delivery',
    });

    const response = await resetDeliveryPersonPassword(
      app,
      ghostToken,
      email,
      password,
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /delivery-people/reset-password — should return 400 when new password is weak', async () => {
    const { email, password, accessToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        rootAdminToken,
        apiToken
      );

    const response = await resetDeliveryPersonPassword(
      app,
      accessToken,
      email,
      password,
      'weak'
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /delivery-people/reset-password — should return 403 when requester is not a delivery person', async () => {
    const [rootAdmin] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, envService.get('ADMIN_ROOT_EMAIL')));

    const adminToken = jwt.sign({
      type: 'user',
      sub: rootAdmin.id,
      role: 'admin',
    });

    const response = await request(app.getHttpServer())
      .patch('/delivery-people/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'some@example.com',
        password: STRONG_PASSWORD,
        new_password: NEW_STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /delivery-people/reset-password — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .patch('/delivery-people/reset-password')
      .send({
        email: 'some@example.com',
        password: STRONG_PASSWORD,
        new_password: NEW_STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(401);
  });
});
