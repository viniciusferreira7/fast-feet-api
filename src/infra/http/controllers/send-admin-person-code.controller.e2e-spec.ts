import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { makeModuleRef } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Send Admin Person Code (E2E)', () => {
  let app: INestApplication;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let rootEmail: string;
  let apiToken: string;

  beforeAll(async () => {
    const moduleRef = await makeModuleRef();

    app = moduleRef.createNestApplication();
    drizzleService = moduleRef.get(DrizzleService);
    envService = moduleRef.get(EnvService);

    await app.init();
  });

  beforeEach(() => {
    rootEmail = envService.get('ADMIN_ROOT_EMAIL');
    apiToken = envService.get('CLIENT_API_KEY') ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('[POST] /admins/code — should send a code and return 201', async () => {
    const response = await sendAdminCode(app, rootEmail, apiToken);

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toContain(rootEmail);
  });

  it('[POST] /admins/code — should return 409 when a valid code already exists', async () => {
    await sendAdminCode(app, rootEmail, apiToken);

    const response = await sendAdminCode(app, rootEmail, apiToken);

    expect(response.statusCode).toBe(409);
  });

  it('[POST] /admins/code — should return 201 after previous code is consumed', async () => {
    await sendAdminCode(app, rootEmail, apiToken);
    const code = await getAdminEmailCode(drizzleService, rootEmail);
    await validateAdminCode(app, rootEmail, code, apiToken);
    await loginAdmin(
      app,
      envService.get('ADMIN_ROOT_CPF'),
      envService.get('ADMIN_ROOT_PASSWORD'),
      apiToken
    );

    const response = await sendAdminCode(app, rootEmail, apiToken);

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toContain(rootEmail);
  });

  it('[POST] /admins/code — should return 400 when email is not found', async () => {
    const response = await request(app.getHttpServer())
      .post('/admins/code')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ email: 'nonexistent@example.com' });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /admins/code — should return 400 for invalid email format', async () => {
    const response = await request(app.getHttpServer())
      .post('/admins/code')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ email: 'not-an-email' });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /admins/code — should return 401 when no API token is provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/admins/code')
      .send({ email: rootEmail });

    expect(response.statusCode).toBe(401);
  });
});
