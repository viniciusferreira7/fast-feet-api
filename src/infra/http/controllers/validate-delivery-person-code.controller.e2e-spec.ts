import { type INestApplication } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import {
  getDeliveryEmailCode,
  registerDeliveryPerson,
  sendDeliveryCode,
  validateDeliveryCode,
} from 'test/e2e/delivery-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { emailsCodes, users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Validate Delivery Person Code (E2E)', () => {
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
    const adminCode = await getAdminEmailCode(drizzleService, rootEmail);
    await validateAdminCode(app, rootEmail, adminCode, apiToken);
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

  it('[PUT] /delivery-people/code — should validate a code and return 200', async () => {
    const { email } = await registerDeliveryPerson(app, rootAdminToken);
    await sendDeliveryCode(app, email, apiToken);
    const code = await getDeliveryEmailCode(drizzleService, email);

    const response = await validateDeliveryCode(app, email, code, apiToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Code validated successfully');
  });

  it('[PUT] /delivery-people/code — should clear the email code after validation', async () => {
    const { email } = await registerDeliveryPerson(app, rootAdminToken);
    await sendDeliveryCode(app, email, apiToken);
    const code = await getDeliveryEmailCode(drizzleService, email);

    await validateDeliveryCode(app, email, code, apiToken);

    const [user] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    expect(user.emailCode).toBeNull();
    expect(user.emailVerifiedAt).toBeTruthy();
  });

  it('[PUT] /delivery-people/code — should return 400 when code is invalid', async () => {
    const { email } = await registerDeliveryPerson(app, rootAdminToken);
    await sendDeliveryCode(app, email, apiToken);

    const response = await validateDeliveryCode(
      app,
      email,
      '00000000',
      apiToken
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /delivery-people/code — should return 400 when no code has been sent', async () => {
    const { email } = await registerDeliveryPerson(app, rootAdminToken);

    const response = await validateDeliveryCode(
      app,
      email,
      '00000000',
      apiToken
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /delivery-people/code — should return 400 when code has expired', async () => {
    const { email } = await registerDeliveryPerson(app, rootAdminToken);
    await sendDeliveryCode(app, email, apiToken);

    const [user] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user.emailCode) throw new Error(`No email code found for ${email}`);

    await drizzleService.db
      .update(emailsCodes)
      .set({ createdAt: sql`now() - interval '10 minutes'` })
      .where(eq(emailsCodes.id, user.emailCode));

    const code = await getDeliveryEmailCode(drizzleService, email);
    const response = await validateDeliveryCode(app, email, code, apiToken);

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /delivery-people/code — should return 400 when email is not found', async () => {
    const response = await validateDeliveryCode(
      app,
      'nonexistent@example.com',
      '12345678',
      apiToken
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /delivery-people/code — should return 400 when code is too short', async () => {
    const { email } = await registerDeliveryPerson(app, rootAdminToken);

    const response = await request(app.getHttpServer())
      .put('/delivery-people/code')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ email, code: '1234' });

    expect(response.statusCode).toBe(400);
  });

  it('[PUT] /delivery-people/code — should return 401 when no API token is provided', async () => {
    const response = await request(app.getHttpServer())
      .put('/delivery-people/code')
      .send({ email: 'any@example.com', code: '12345678' });

    expect(response.statusCode).toBe(401);
  });
});
