import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import {
  createAuthenticatedRecipientPerson,
  updateRecipientPerson,
} from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Update Recipient Person (E2E)', () => {
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

  it('[PATCH] /recipients — should update name and return 200', async () => {
    const { accessToken } = await createAuthenticatedRecipientPerson(
      app,
      drizzleService,
      apiToken
    );

    const response = await updateRecipientPerson(app, accessToken, {
      name: 'Updated Recipient Name',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.recipient).toEqual(
      expect.objectContaining({ name: 'Updated Recipient Name' })
    );
  });

  it('[PATCH] /recipients — should update email, clear emailVerifiedAt, and return 200', async () => {
    const { accessToken } = await createAuthenticatedRecipientPerson(
      app,
      drizzleService,
      apiToken
    );

    const newEmail = `updated-recipient-${Date.now()}@example.com`;

    const response = await updateRecipientPerson(app, accessToken, {
      email: newEmail,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.recipient).toEqual(
      expect.objectContaining({ email: newEmail })
    );

    const [updated] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, newEmail));

    expect(updated.emailVerifiedAt).toBeNull();
  });

  it('[PATCH] /recipients — should update both name and email and return 200', async () => {
    const { accessToken } = await createAuthenticatedRecipientPerson(
      app,
      drizzleService,
      apiToken
    );

    const newEmail = `both-recipient-${Date.now()}@example.com`;

    const response = await updateRecipientPerson(app, accessToken, {
      name: 'New Recipient Name',
      email: newEmail,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.recipient).toEqual(
      expect.objectContaining({ name: 'New Recipient Name', email: newEmail })
    );
  });

  it('[PATCH] /recipients — should return 409 when email is already in use', async () => {
    const { accessToken } = await createAuthenticatedRecipientPerson(
      app,
      drizzleService,
      apiToken
    );

    const { email: takenEmail } = await createAuthenticatedRecipientPerson(
      app,
      drizzleService,
      apiToken
    );

    const response = await updateRecipientPerson(app, accessToken, {
      email: takenEmail,
    });

    expect(response.statusCode).toBe(409);
  });

  it('[PATCH] /recipients — should return 403 when requester is not a recipient', async () => {
    const adminToken = jwt.sign({
      type: 'user',
      sub: randomUUID(),
      role: 'admin',
    });

    const response = await request(app.getHttpServer())
      .patch('/recipients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Hacker' });

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /recipients — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .patch('/recipients')
      .send({ name: 'No Token' });

    expect(response.statusCode).toBe(401);
  });

  it('[PATCH] /recipients — should return 400 for invalid email format', async () => {
    const { accessToken } = await createAuthenticatedRecipientPerson(
      app,
      drizzleService,
      apiToken
    );

    const response = await updateRecipientPerson(app, accessToken, {
      email: 'not-an-email',
    });

    expect(response.statusCode).toBe(400);
  });
});
