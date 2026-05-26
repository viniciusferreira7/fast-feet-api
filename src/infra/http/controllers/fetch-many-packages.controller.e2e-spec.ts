import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { createAuthenticatedDeliveryPerson } from 'test/e2e/delivery-flow';
import { fetchManyPackages, registerPackage } from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Fetch Many Packages (E2E)', () => {
  let app: INestApplication;
  let _jwt: JwtService;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let adminToken: string;
  let apiToken: string;

  beforeAll(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    _jwt = moduleRef.get(JwtService);
    drizzleService = moduleRef.get(DrizzleService);
    envService = moduleRef.get(EnvService);
  });

  beforeEach(async () => {
    const rootEmail = envService.get('ADMIN_ROOT_EMAIL');
    apiToken = envService.get('CLIENT_API_KEY') ?? '';

    await sendAdminCode(app, rootEmail, apiToken);
    const code = await getAdminEmailCode(drizzleService, rootEmail);
    await validateAdminCode(app, rootEmail, code, apiToken);
    adminToken = await loginAdmin(
      app,
      envService.get('ADMIN_ROOT_CPF'),
      envService.get('ADMIN_ROOT_PASSWORD'),
      apiToken
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('[GET] /packages — should return 200 with paginated structure', async () => {
    const response = await fetchManyPackages(app, adminToken);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        packages: expect.any(Array),
        page: expect.any(Number),
        per_page: expect.any(Number),
        total_pages: expect.any(Number),
      })
    );
  });

  it('[GET] /packages — should filter packages by search query', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const uniqueName = `Unique-Package-${Date.now()}`;
    await registerPackage(app, adminToken, {
      recipientId,
      name: uniqueName,
    });

    const response = await fetchManyPackages(app, adminToken, {
      search: uniqueName,
    });

    expect(response.statusCode).toBe(200);
    expect(
      response.body.packages.some(
        (p: { name: string }) => p.name === uniqueName
      )
    ).toBe(true);
  });

  it('[GET] /packages — should filter packages by status query', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    await registerPackage(app, adminToken, { recipientId });

    const response = await fetchManyPackages(app, adminToken, {
      status: 'pending',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.packages.length).toBeGreaterThan(0);
    expect(
      response.body.packages.every(
        (p: { status: string }) => p.status === 'pending'
      )
    ).toBe(true);
  });

  it('[GET] /packages — should return at most 1 item when per_page=1', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    await Promise.all([
      registerPackage(app, adminToken, { recipientId }),
      registerPackage(app, adminToken, { recipientId }),
    ]);

    const response = await fetchManyPackages(app, adminToken, { per_page: 1 });

    expect(response.statusCode).toBe(200);
    expect(response.body.packages.length).toBeLessThanOrEqual(1);
    expect(response.body.per_page).toBe(1);
  });

  it('[GET] /packages — should return 403 when requester is a delivery person', async () => {
    const { accessToken: deliveryToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        adminToken,
        apiToken
      );

    const response = await request(app.getHttpServer())
      .get('/packages')
      .set('Authorization', `Bearer ${deliveryToken}`);

    expect(response.statusCode).toBe(403);
  });

  it('[GET] /packages — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).get('/packages');

    expect(response.statusCode).toBe(401);
  });
});
