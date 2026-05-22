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
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Fetch Many Delivery Person (E2E)', () => {
  let app: INestApplication;
  let _jwt: JwtService;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let rootAdminToken: string;
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

  it('[GET] /delivery-people — should return 200 with paginated list', async () => {
    await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await request(app.getHttpServer())
      .get('/delivery-people')
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        page: expect.any(Number),
        total_pages: expect.any(Number),
        per_page: expect.any(Number),
        delivery_people: expect.any(Array),
      })
    );
    expect(response.body.delivery_people.length).toBeGreaterThan(0);
  });

  it('[GET] /delivery-people — should filter by is_active', async () => {
    const response = await request(app.getHttpServer())
      .get('/delivery-people?is_active=true')
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(200);
    expect(
      response.body.delivery_people.every(
        (p: { is_active: boolean }) => p.is_active === true
      )
    ).toBe(true);
  });

  it('[GET] /delivery-people — should filter by name search', async () => {
    const uniqueName = `UniqueDelivery${Date.now()}`;
    await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken,
      { name: uniqueName }
    );

    const response = await request(app.getHttpServer())
      .get(`/delivery-people?name=${uniqueName}`)
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(200);
    expect(
      response.body.delivery_people.some(
        (p: { name: string }) => p.name === uniqueName
      )
    ).toBe(true);
  });

  it('[GET] /delivery-people — should respect per_page pagination', async () => {
    const response = await request(app.getHttpServer())
      .get('/delivery-people?page=1&per_page=1')
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.delivery_people.length).toBeLessThanOrEqual(1);
    expect(response.body.per_page).toBe(1);
  });

  it('[GET] /delivery-people — should return 403 when requester is not an admin', async () => {
    const { accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await request(app.getHttpServer())
      .get('/delivery-people')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  it('[GET] /delivery-people — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).get('/delivery-people');

    expect(response.statusCode).toBe(401);
  });
});
