import { type INestApplication } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import request from 'supertest';
import {
  getAdminEmailCode,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { makeModuleRef } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { emailsCodes, users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Validate Admin Person Code (E2E)', () => {
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

  it('[PUT] /admins/code — should validate a code and return 200', async () => {
    await sendAdminCode(app, rootEmail, apiToken);
    const code = await getAdminEmailCode(drizzleService, rootEmail);

    const response = await validateAdminCode(app, rootEmail, code, apiToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Code validated successfully');
  });

  it('[PUT] /admins/code — should clear the email code after validation', async () => {
    await sendAdminCode(app, rootEmail, apiToken);
    const code = await getAdminEmailCode(drizzleService, rootEmail);

    await validateAdminCode(app, rootEmail, code, apiToken);

    const [user] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, rootEmail));

    expect(user.emailCode).toBeNull();
    expect(user.emailVerifiedAt).toBeTruthy();
  });

  it('[PUT] /admins/code — should return 400 when code is invalid', async () => {
    await sendAdminCode(app, rootEmail, apiToken);

    const response = await validateAdminCode(
      app,
      rootEmail,
      '00000000',
      apiToken
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /admins/code — should return 400 when no code has been sent', async () => {
    const response = await validateAdminCode(
      app,
      rootEmail,
      '00000000',
      apiToken
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /admins/code — should return 400 when code has expired', async () => {
    await sendAdminCode(app, rootEmail, apiToken);

    const [user] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, rootEmail));

    if (!user.emailCode) throw new Error(`No email code found for ${rootEmail}`);

    await drizzleService.db
      .update(emailsCodes)
      .set({ createdAt: sql`now() - interval '10 minutes'` })
      .where(eq(emailsCodes.id, user.emailCode));

    const code = await getAdminEmailCode(drizzleService, rootEmail);

    const response = await validateAdminCode(app, rootEmail, code, apiToken);

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /admins/code — should return 400 when email is not found', async () => {
    const response = await validateAdminCode(
      app,
      'nonexistent@example.com',
      '12345678',
      apiToken
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /admins/code — should return 400 for invalid email format', async () => {
    const response = await request(app.getHttpServer())
      .put('/admins/code')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ email: 'not-an-email', code: '12345678' });

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /admins/code — should return 400 when code is too short', async () => {
    const response = await request(app.getHttpServer())
      .put('/admins/code')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ email: rootEmail, code: '1234' });

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /admins/code — should return 401 when no API token is provided', async () => {
    const response = await request(app.getHttpServer())
      .put('/admins/code')
      .send({ email: rootEmail, code: '12345678' });

    expect(response.statusCode).toBe(401);
  });
});
