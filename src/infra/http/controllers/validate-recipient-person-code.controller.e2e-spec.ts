import { type INestApplication } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import request from 'supertest';
import {
  getRecipientEmailCode,
  registerRecipientPerson,
  sendRecipientCode,
  validateRecipientCode,
} from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { emailsCodes, users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Validate Recipient Person Code (E2E)', () => {
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

  it('[PUT] /recipients/code — should validate a code and return 200', async () => {
    const { email } = await registerRecipientPerson(app, apiToken);
    await sendRecipientCode(app, email, apiToken);
    const code = await getRecipientEmailCode(drizzleService, email);

    const response = await validateRecipientCode(app, email, code, apiToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Code validated successfully');
  });

  it('[PUT] /recipients/code — should clear the email code after validation', async () => {
    const { email } = await registerRecipientPerson(app, apiToken);
    await sendRecipientCode(app, email, apiToken);
    const code = await getRecipientEmailCode(drizzleService, email);

    await validateRecipientCode(app, email, code, apiToken);

    const [user] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    expect(user.emailCode).toBeNull();
    expect(user.emailVerifiedAt).toBeTruthy();
  });

  it('[PUT] /recipients/code — should return 400 when code is invalid', async () => {
    const { email } = await registerRecipientPerson(app, apiToken);
    await sendRecipientCode(app, email, apiToken);

    const response = await validateRecipientCode(
      app,
      email,
      '00000000',
      apiToken
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /recipients/code — should return 400 when no code has been sent', async () => {
    const { email } = await registerRecipientPerson(app, apiToken);

    const response = await validateRecipientCode(
      app,
      email,
      '00000000',
      apiToken
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /recipients/code — should return 400 when code has expired', async () => {
    const { email } = await registerRecipientPerson(app, apiToken);
    await sendRecipientCode(app, email, apiToken);

    const [user] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user.emailCode) throw new Error(`No email code found for ${email}`);

    await drizzleService.db
      .update(emailsCodes)
      .set({ createdAt: sql`now() - interval '10 minutes'` })
      .where(eq(emailsCodes.id, user.emailCode));

    const code = await getRecipientEmailCode(drizzleService, email);
    const response = await validateRecipientCode(app, email, code, apiToken);

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /recipients/code — should return 400 when email is not found', async () => {
    const response = await validateRecipientCode(
      app,
      'nonexistent@example.com',
      '12345678',
      apiToken
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /recipients/code — should return 400 when code is too short', async () => {
    const { email } = await registerRecipientPerson(app, apiToken);

    const response = await request(app.getHttpServer())
      .put('/recipients/code')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ email, code: '1234' });

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /recipients/code — should return 401 when no API token is provided', async () => {
    const response = await request(app.getHttpServer())
      .put('/recipients/code')
      .send({ email: 'any@example.com', code: '12345678' });

    expect(response.statusCode).toBe(401);
  });
});
