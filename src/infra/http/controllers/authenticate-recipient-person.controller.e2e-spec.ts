import { type INestApplication } from '@nestjs/common';
import { generate as generateCpf } from 'gerador-validador-cpf';
import request from 'supertest';
import {
  createAuthenticatedRecipientPerson,
  registerRecipientPerson,
} from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

const STRONG_PASSWORD = 'MyS3cur3P@ssw0rd!';

describe('Authenticate Recipient Person (E2E)', () => {
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

  it('[POST] /recipients/login — should authenticate and return 200 with access_token', async () => {
    const { cpf, password } = await createAuthenticatedRecipientPerson(
      app,
      drizzleService,
      apiToken
    );

    const response = await request(app.getHttpServer())
      .post('/recipients/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf, password });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ access_token: expect.any(String) })
    );
  });

  it('[POST] /recipients/login — should return 400 when CPF is not found', async () => {
    const response = await request(app.getHttpServer())
      .post('/recipients/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf: generateCpf(), password: STRONG_PASSWORD });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /recipients/login — should return 400 when password is wrong', async () => {
    const { cpf } = await createAuthenticatedRecipientPerson(
      app,
      drizzleService,
      apiToken
    );

    const response = await request(app.getHttpServer())
      .post('/recipients/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf, password: 'Wr0ngP@ssw0rd!' });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /recipients/login — should return 400 when email has not been verified', async () => {
    const { cpf, password } = await registerRecipientPerson(app, apiToken);

    const response = await request(app.getHttpServer())
      .post('/recipients/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf, password });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /recipients/login — should return 401 when no API token is provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/recipients/login')
      .send({ cpf: generateCpf(), password: STRONG_PASSWORD });

    expect(response.statusCode).toBe(401);
  });

  it('[POST] /recipients/login — should return 400 for invalid CPF format', async () => {
    const response = await request(app.getHttpServer())
      .post('/recipients/login')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ cpf: '00000000000', password: STRONG_PASSWORD });

    expect(response.statusCode).toBe(400);
  });
});
