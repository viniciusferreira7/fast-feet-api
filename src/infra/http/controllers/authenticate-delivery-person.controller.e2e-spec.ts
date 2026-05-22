import { type INestApplication } from '@nestjs/common';
import { generate as generateCpf } from 'gerador-validador-cpf';
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
} from 'test/e2e/delivery-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

const STRONG_PASSWORD = 'MyS3cur3P@ssw0rd!';

describe('Authenticate Delivery Person (E2E)', () => {
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

  it('[POST] /delivery-people/login — should authenticate and return 200 with access_token', async () => {
    const { cpf, password } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await request(app.getHttpServer())
      .post('/delivery-people/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf, password });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ access_token: expect.any(String) })
    );
  });

  it('[POST] /delivery-people/login — should return 400 when CPF is not found', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-people/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf: generateCpf(), password: STRONG_PASSWORD });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /delivery-people/login — should return 400 when password is wrong', async () => {
    const { cpf } = await createAuthenticatedDeliveryPerson(
      app,
      drizzleService,
      rootAdminToken,
      apiToken
    );

    const response = await request(app.getHttpServer())
      .post('/delivery-people/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf, password: 'Wr0ngP@ssw0rd!' });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /delivery-people/login — should return 400 when email has not been verified', async () => {
    const { cpf, password } = await registerDeliveryPerson(app, rootAdminToken);

    const response = await request(app.getHttpServer())
      .post('/delivery-people/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf, password });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /delivery-people/login — should return 401 when no API token is provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-people/login')
      .send({ cpf: generateCpf(), password: STRONG_PASSWORD });

    expect(response.statusCode).toBe(401);
  });

  it('[POST] /delivery-people/login — should return 400 for invalid CPF format', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-people/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf: '00000000000', password: STRONG_PASSWORD });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /delivery-people/login — should return 400 when password is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-people/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf: generateCpf() });

    expect(response.statusCode).toBe(400);
  });
});
