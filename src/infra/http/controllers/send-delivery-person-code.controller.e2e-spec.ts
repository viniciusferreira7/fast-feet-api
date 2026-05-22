import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import {
  getDeliveryEmailCode,
  loginDeliveryPerson,
  registerDeliveryPerson,
  sendDeliveryCode,
  validateDeliveryCode,
} from 'test/e2e/delivery-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Send Delivery Person Code (E2E)', () => {
  let app: INestApplication;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let rootAdminToken: string;
  let apiToken: string;

  beforeAll(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
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

  it('[POST] /delivery-people/code — should send a code and return 201', async () => {
    const { email } = await registerDeliveryPerson(app, rootAdminToken);

    const response = await sendDeliveryCode(app, email, apiToken);

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toContain(email);
  });

  it('[POST] /delivery-people/code — should return 409 when a valid code already exists', async () => {
    const { email } = await registerDeliveryPerson(app, rootAdminToken);

    await sendDeliveryCode(app, email, apiToken);
    const response = await sendDeliveryCode(app, email, apiToken);

    expect(response.statusCode).toBe(409);
  });

  it('[POST] /delivery-people/code — should return 201 after previous code is consumed', async () => {
    const { email, cpf, password } = await registerDeliveryPerson(
      app,
      rootAdminToken
    );

    await sendDeliveryCode(app, email, apiToken);
    const code = await getDeliveryEmailCode(drizzleService, email);
    await validateDeliveryCode(app, email, code, apiToken);
    await loginDeliveryPerson(app, cpf, password, apiToken);

    const response = await sendDeliveryCode(app, email, apiToken);

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toContain(email);
  });

  it('[POST] /delivery-people/code — should return 400 when email is not found', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-people/code')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ email: 'nonexistent@example.com' });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /delivery-people/code — should return 400 for invalid email format', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-people/code')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ email: 'not-an-email' });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /delivery-people/code — should return 401 when no API token is provided', async () => {
    const { email } = await registerDeliveryPerson(app, rootAdminToken);

    const response = await request(app.getHttpServer())
      .post('/delivery-people/code')
      .send({ email });

    expect(response.statusCode).toBe(401);
  });
});
