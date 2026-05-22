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

describe('Delete Delivery Person (E2E)', () => {
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

  it('[DELETE] /delivery-people/cpf/:cpf — should disable the delivery person and return 204', async () => {
    const { cpf } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await request(app.getHttpServer())
      .delete(`/delivery-people/cpf/${encodeURIComponent(cpf)}`)
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(204);
  });

  it('[DELETE] /delivery-people/cpf/:cpf — should return 400 when already disabled', async () => {
    const { cpf } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    await request(app.getHttpServer())
      .delete(`/delivery-people/cpf/${encodeURIComponent(cpf)}`)
      .set('Authorization', `Bearer ${rootAdminToken}`);

    const response = await request(app.getHttpServer())
      .delete(`/delivery-people/cpf/${encodeURIComponent(cpf)}`)
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(400);
  });

  it('[DELETE] /delivery-people/cpf/:cpf — should return 400 when delivery person is not found', async () => {
    const response = await request(app.getHttpServer())
      .delete('/delivery-people/cpf/999.999.999-99')
      .set('Authorization', `Bearer ${rootAdminToken}`);

    expect(response.statusCode).toBe(400);
  });

  it('[DELETE] /delivery-people/cpf/:cpf — should return 403 when requester is not an admin', async () => {
    const { cpf, accessToken } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await request(app.getHttpServer())
      .delete(`/delivery-people/cpf/${encodeURIComponent(cpf)}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  it('[DELETE] /delivery-people/cpf/:cpf — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).delete(
      '/delivery-people/cpf/123.456.789-09'
    );

    expect(response.statusCode).toBe(401);
  });
});
