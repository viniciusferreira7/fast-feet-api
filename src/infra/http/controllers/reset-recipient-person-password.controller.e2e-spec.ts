import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import {
  createAuthenticatedRecipientPerson,
  registerRecipientPerson,
  resetRecipientPersonPassword,
} from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

const STRONG_PASSWORD = 'MyS3cur3P@ssw0rd!';
const NEW_STRONG_PASSWORD = 'N3wS3cur3P@ssw0rd!';

describe('Reset Recipient Person Password (E2E)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let apiToken: string;

  beforeAll(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    jwt = moduleRef.get(JwtService);
    drizzleService = moduleRef.get(DrizzleService);
    envService = moduleRef.get(EnvService);
  });

  beforeEach(() => {
    apiToken = envService.get('CLIENT_API_KEY') ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('[PATCH] /recipients/reset-password — should reset password and return 204', async () => {
    const { email, password, accessToken } =
      await createAuthenticatedRecipientPerson(app, drizzleService, apiToken);

    const response = await resetRecipientPersonPassword(
      app,
      accessToken,
      email,
      password,
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(204);
  });

  it('[PATCH] /recipients/reset-password — should return 400 when password is wrong', async () => {
    const { email, accessToken } = await createAuthenticatedRecipientPerson(
      app,
      drizzleService,
      apiToken
    );

    const response = await resetRecipientPersonPassword(
      app,
      accessToken,
      email,
      'Wr0ngP@ssw0rd!',
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /recipients/reset-password — should return 400 when email is not found', async () => {
    const { accessToken } = await createAuthenticatedRecipientPerson(
      app,
      drizzleService,
      apiToken
    );

    const response = await resetRecipientPersonPassword(
      app,
      accessToken,
      'nonexistent@example.com',
      STRONG_PASSWORD,
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /recipients/reset-password — should return 400 when email code has not been verified', async () => {
    const { email, password } = await registerRecipientPerson(app, apiToken);

    const ghostToken = jwt.sign({
      type: 'user',
      sub: randomUUID(),
      role: 'recipient',
    });

    const response = await resetRecipientPersonPassword(
      app,
      ghostToken,
      email,
      password,
      NEW_STRONG_PASSWORD
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /recipients/reset-password — should return 400 when new password is weak', async () => {
    const { email, password, accessToken } =
      await createAuthenticatedRecipientPerson(app, drizzleService, apiToken);

    const response = await resetRecipientPersonPassword(
      app,
      accessToken,
      email,
      password,
      'weak'
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /recipients/reset-password — should return 403 when requester is not a recipient', async () => {
    const adminToken = jwt.sign({
      type: 'user',
      sub: randomUUID(),
      role: 'admin',
    });

    const response = await request(app.getHttpServer())
      .patch('/recipients/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'some@example.com',
        password: STRONG_PASSWORD,
        new_password: NEW_STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /recipients/reset-password — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .patch('/recipients/reset-password')
      .send({
        email: 'some@example.com',
        password: STRONG_PASSWORD,
        new_password: NEW_STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(401);
  });
});
