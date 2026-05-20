import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import {
  createAuthenticatedAdmin,
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Get By Id Admin Person (E2E)', () => {
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

  it('[GET] /admins/:id — should return 200 with admin data when requesting own profile', async () => {
    const response = await request(app.getHttpServer())
      .get(`/admins/${rootAdminId}`)
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.admin).toEqual(
      expect.objectContaining({
        id: rootAdminId,
        name: expect.any(String),
        cpf: expect.any(String),
        email: expect.any(String),
        created_at: expect.any(String),
      })
    );
  });

  it('[GET] /admins/:id — should return 200 with admin data when requested by another admin', async () => {
    const { email } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const [targetAdmin] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    const response = await request(app.getHttpServer())
      .get(`/admins/${targetAdmin.id}`)
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.admin).toEqual(
      expect.objectContaining({
        id: targetAdmin.id,
        email,
      })
    );
  });

  it('[GET] /admins/:id — should return 406 when admin is not found', async () => {
    const response = await request(app.getHttpServer())
      .get(`/admins/${randomUUID()}`)
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(406);
  });

  it('[GET] /admins/:id — should return 403 when requester has no record in the admin repository', async () => {
    const ghostToken = jwt.sign({
      type: 'user',
      sub: randomUUID(),
      role: 'admin',
    });

    const { email } = await createAuthenticatedAdmin(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const [targetAdmin] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    const response = await request(app.getHttpServer())
      .get(`/admins/${targetAdmin.id}`)
      .set('Authorization', `Bearer ${ghostToken}`);

    expect(response.statusCode).toBe(403);
  });

  it('[GET] /admins/:id — should return 403 when requester is not an admin', async () => {
    const deliveryToken = jwt.sign({
      type: 'user',
      sub: rootAdminId,
      role: 'delivery',
    });

    const response = await request(app.getHttpServer())
      .get(`/admins/${rootAdminId}`)
      .set('Authorization', `Bearer ${deliveryToken}`);

    expect(response.statusCode).toBe(403);
  });

  it('[GET] /admins/:id — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).get(
      `/admins/${rootAdminId}`
    );

    expect(response.statusCode).toBe(401);
  });
});
