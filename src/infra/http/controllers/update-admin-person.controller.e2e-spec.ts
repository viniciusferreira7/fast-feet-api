import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import {
  createAuthenticatedAdmin,
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  updateAdmin,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Update Admin Person (E2E)', () => {
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

  it('[PATCH] /admins — should update name and return 200', async () => {
    const { accessToken } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await updateAdmin(app, accessToken, {
      name: 'Updated Name',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.admin).toEqual(
      expect.objectContaining({ name: 'Updated Name' })
    );
  });

  it('[PATCH] /admins — should update email, clear emailVerifiedAt, and return 200', async () => {
    const { accessToken } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const newEmail = `updated-${Date.now()}@example.com`;

    const response = await updateAdmin(app, accessToken, { email: newEmail });

    expect(response.statusCode).toBe(200);
    expect(response.body.admin).toEqual(
      expect.objectContaining({ email: newEmail })
    );

    const [updated] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, newEmail));

    expect(updated.emailVerifiedAt).toBeNull();
  });

  it('[PATCH] /admins — should update both name and email and return 200', async () => {
    const { accessToken } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const newEmail = `both-${Date.now()}@example.com`;

    const response = await updateAdmin(app, accessToken, {
      name: 'New Name',
      email: newEmail,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.admin).toEqual(
      expect.objectContaining({ name: 'New Name', email: newEmail })
    );
  });

  it('[PATCH] /admins — should return 409 when email is already in use', async () => {
    const { accessToken } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const { email: takenEmail } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await updateAdmin(app, accessToken, {
      email: takenEmail,
    });

    expect(response.statusCode).toBe(409);
  });

  it('[PATCH] /admins — should return 403 when requester is not an admin', async () => {
    const deliveryToken = jwt.sign({
      type: 'user',
      sub: rootAdminId,
      role: 'delivery',
    });

    const response = await request(app.getHttpServer())
      .patch('/admins')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({ name: 'Hacker' });

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /admins — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .patch('/admins')
      .send({ name: 'No Token' });

    expect(response.statusCode).toBe(401);
  });

  it('[PATCH] /admins — should return 400 for invalid email format', async () => {
    const { accessToken } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await updateAdmin(app, accessToken, {
      email: 'not-an-email',
    });

    expect(response.statusCode).toBe(400);
  });
});
