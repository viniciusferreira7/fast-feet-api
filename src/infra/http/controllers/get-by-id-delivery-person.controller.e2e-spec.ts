import { randomUUID } from 'node:crypto';
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
import { createAuthenticatedDeliveryPerson } from 'test/e2e/delivery-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Get By Id Delivery Person (E2E)', () => {
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

  it('[GET] /delivery-people/:id — should return 200 when admin requests a delivery person', async () => {
    const { email } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const [deliveryUser] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    const response = await request(app.getHttpServer())
      .get(`/delivery-people/${deliveryUser.id}`)
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.delivery_person).toEqual(
      expect.objectContaining({
        id: deliveryUser.id,
        email,
      })
    );
  });

  it('[GET] /delivery-people/:id — should return 200 when delivery person requests their own profile', async () => {
    const { email, accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const [deliveryUser] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    const response = await request(app.getHttpServer())
      .get(`/delivery-people/${deliveryUser.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.delivery_person).toEqual(
      expect.objectContaining({ id: deliveryUser.id })
    );
  });

  it('[GET] /delivery-people/:id — should return 406 when delivery person is not found', async () => {
    const response = await request(app.getHttpServer())
      .get(`/delivery-people/${randomUUID()}`)
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(406);
  });

  it('[GET] /delivery-people/:id — should return 403 when a delivery person tries to get another', async () => {
    const { accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const { email: otherEmail } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const [otherUser] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, otherEmail));

    const response = await request(app.getHttpServer())
      .get(`/delivery-people/${otherUser.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  it('[GET] /delivery-people/:id — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).get(
      `/delivery-people/${randomUUID()}`
    );

    expect(response.statusCode).toBe(401);
  });
});
