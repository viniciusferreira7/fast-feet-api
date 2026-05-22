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
  updateDeliveryPerson,
} from 'test/e2e/delivery-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Update Delivery Person (E2E)', () => {
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

  it('[PATCH] /delivery-people — should update name and return 200', async () => {
    const { accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await updateDeliveryPerson(app, accessToken, {
      name: 'Updated Delivery Name',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.delivery_person).toEqual(
      expect.objectContaining({ name: 'Updated Delivery Name' })
    );
  });

  it('[PATCH] /delivery-people — should update email, clear emailVerifiedAt, and return 200', async () => {
    const { accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const newEmail = `updated-delivery-${Date.now()}@example.com`;

    const response = await updateDeliveryPerson(app, accessToken, {
      email: newEmail,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.delivery_person).toEqual(
      expect.objectContaining({ email: newEmail })
    );

    const [updated] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, newEmail));

    expect(updated.emailVerifiedAt).toBeNull();
  });

  it('[PATCH] /delivery-people — should update both name and email and return 200', async () => {
    const { accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const newEmail = `both-delivery-${Date.now()}@example.com`;

    const response = await updateDeliveryPerson(app, accessToken, {
      name: 'New Delivery Name',
      email: newEmail,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.delivery_person).toEqual(
      expect.objectContaining({ name: 'New Delivery Name', email: newEmail })
    );
  });

  it('[PATCH] /delivery-people — should return 409 when email is already in use', async () => {
    const { accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const { email: takenEmail } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await updateDeliveryPerson(app, accessToken, {
      email: takenEmail,
    });

    expect(response.statusCode).toBe(409);
  });

  it('[PATCH] /delivery-people — should return 403 when requester is not a delivery person', async () => {
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
      .patch('/delivery-people')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Hacker' });

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /delivery-people — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .patch('/delivery-people')
      .send({ name: 'No Token' });

    expect(response.statusCode).toBe(401);
  });

  it('[PATCH] /delivery-people — should return 400 for invalid email format', async () => {
    const { accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await updateDeliveryPerson(app, accessToken, {
      email: 'not-an-email',
    });

    expect(response.statusCode).toBe(400);
  });
});
