import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generate as generateCpf } from 'gerador-validador-cpf';
import request from 'supertest';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { EnvService } from '@/infra/env/env.service';

const STRONG_PASSWORD = 'MyS3cur3P@ssw0rd!';

describe('Register Recipient Person (E2E)', () => {
  let app: INestApplication;
  let _jwt: JwtService;
  let envService: EnvService;
  let apiToken: string;

  beforeAll(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    _jwt = moduleRef.get(JwtService);
    envService = moduleRef.get(EnvService);
  });

  beforeEach(() => {
    apiToken = envService.get('CLIENT_API_KEY') ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('[POST] /recipients — should register a new recipient and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        name: 'Jane Recipient',
        cpf: generateCpf(),
        email: `recipient-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.recipient).toEqual(
      expect.objectContaining({ name: 'Jane Recipient' })
    );
  });

  it('[POST] /recipients — should return 401 when no API token is provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/recipients')
      .send({
        name: 'Jane Recipient',
        cpf: generateCpf(),
        email: `recipient-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(401);
  });

  it('[POST] /recipients — should return 409 when email is already in use', async () => {
    const email = `dup-recipient-${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        name: 'First',
        cpf: generateCpf(),
        email,
        password: STRONG_PASSWORD,
      });

    const response = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        name: 'Second',
        cpf: generateCpf(),
        email,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(409);
  });

  it('[POST] /recipients — should return 409 when CPF is already in use', async () => {
    const cpf = generateCpf();

    await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        name: 'First',
        cpf,
        email: `first-r-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    const response = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        name: 'Second',
        cpf,
        email: `second-r-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(409);
  });

  it('[POST] /recipients — should return 400 for invalid CPF', async () => {
    const response = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        name: 'Jane Recipient',
        cpf: '00000000000',
        email: `recipient-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /recipients — should return 400 for a password that does not meet requirements', async () => {
    const response = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        name: 'Jane Recipient',
        cpf: generateCpf(),
        email: `recipient-${Date.now()}@example.com`,
        password: 'weak',
      });

    expect(response.statusCode).toBe(400);
  });
});
