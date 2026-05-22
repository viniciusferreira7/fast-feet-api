import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  getRecipientEmailCode,
  loginRecipientPerson,
  registerRecipientPerson,
  sendRecipientCode,
  validateRecipientCode,
} from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Send Recipient Person Code (E2E)', () => {
  let app: INestApplication;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let apiToken: string;

  beforeAll(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    drizzleService = moduleRef.get(DrizzleService);
    envService = moduleRef.get(EnvService);
  });

  beforeEach(() => {
    apiToken = envService.get('CLIENT_API_KEY') ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('[POST] /recipients/code — should send a code and return 201', async () => {
    const { email } = await registerRecipientPerson(app, apiToken);

    const response = await sendRecipientCode(app, email, apiToken);

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toContain(email);
  });

  it('[POST] /recipients/code — should return 409 when a valid code already exists', async () => {
    const { email } = await registerRecipientPerson(app, apiToken);

    await sendRecipientCode(app, email, apiToken);
    const response = await sendRecipientCode(app, email, apiToken);

    expect(response.statusCode).toBe(409);
  });

  it('[POST] /recipients/code — should return 201 after previous code is consumed', async () => {
    const { email, cpf, password } = await registerRecipientPerson(
      app,
      apiToken
    );

    await sendRecipientCode(app, email, apiToken);
    const code = await getRecipientEmailCode(drizzleService, email);
    await validateRecipientCode(app, email, code, apiToken);
    await loginRecipientPerson(app, cpf, password, apiToken);

    const response = await sendRecipientCode(app, email, apiToken);

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toContain(email);
  });

  it('[POST] /recipients/code — should return 400 when email is not found', async () => {
    const response = await request(app.getHttpServer())
      .post('/recipients/code')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ email: 'nonexistent@example.com' });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /recipients/code — should return 400 for invalid email format', async () => {
    const response = await request(app.getHttpServer())
      .post('/recipients/code')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ email: 'not-an-email' });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /recipients/code — should return 401 when no API token is provided', async () => {
    const { email } = await registerRecipientPerson(app, apiToken);

    const response = await request(app.getHttpServer())
      .post('/recipients/code')
      .send({ email });

    expect(response.statusCode).toBe(401);
  });
});
