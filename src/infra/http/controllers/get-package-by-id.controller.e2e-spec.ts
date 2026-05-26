import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { createAuthenticatedDeliveryPerson } from 'test/e2e/delivery-flow';
import { getPackageById, registerPackage } from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Get Package By Id (E2E)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let adminToken: string;
  let apiToken: string;

  beforeAll(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    jwt = moduleRef.get(JwtService);
    drizzleService = moduleRef.get(DrizzleService);
    envService = moduleRef.get(EnvService);
  });

  beforeEach(async () => {
    const rootEmail = envService.get('ADMIN_ROOT_EMAIL');
    apiToken = envService.get('CLIENT_API_KEY') ?? '';

    await sendAdminCode(app, rootEmail, apiToken);
    const code = await getAdminEmailCode(drizzleService, rootEmail);
    await validateAdminCode(app, rootEmail, code, apiToken);
    adminToken = await loginAdmin(
      app,
      envService.get('ADMIN_ROOT_CPF'),
      envService.get('ADMIN_ROOT_PASSWORD'),
      apiToken
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('[GET] /packages/:packageId — should return 200 with full package data', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
      name: 'Laptop Dell XPS',
      postalCode: '01310-100',
    });

    const response = await getPackageById(app, adminToken, packageId);

    expect(response.statusCode).toBe(200);
    expect(response.body.package).toEqual(
      expect.objectContaining({
        id: packageId,
        name: 'Laptop Dell XPS',
        status: 'pending',
        recipient: expect.objectContaining({ id: recipientId }),
        postal_code: '01310-100',
      })
    );
  });

  it('[GET] /packages/:packageId — should return all expected fields', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    const response = await getPackageById(app, adminToken, packageId);

    expect(response.statusCode).toBe(200);
    expect(response.body.package).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        code: expect.any(String),
        recipient: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
        }),
        recipient_address: expect.any(String),
        author: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        }),
        status: expect.any(String),
        postal_code: expect.any(String),
        created_at: expect.any(String),
      })
    );
  });

  it('[GET] /packages/:packageId — should return 404 when package does not exist', async () => {
    const response = await getPackageById(app, adminToken, randomUUID());

    expect(response.statusCode).toBe(404);
  });

  it('[GET] /packages/:packageId — should return 403 when requester is a delivery person', async () => {
    const { accessToken: deliveryToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        adminToken,
        apiToken
      );

    const response = await request(app.getHttpServer())
      .get(`/packages/${randomUUID()}`)
      .set('Authorization', `Bearer ${deliveryToken}`);

    expect(response.statusCode).toBe(403);
  });

  it('[GET] /packages/:packageId — should return 403 when requester is a recipient', async () => {
    const recipientToken = jwt.sign({
      type: 'user',
      sub: randomUUID(),
      role: 'recipient',
    });

    const response = await request(app.getHttpServer())
      .get(`/packages/${randomUUID()}`)
      .set('Authorization', `Bearer ${recipientToken}`);

    expect(response.statusCode).toBe(403);
  });

  it('[GET] /packages/:packageId — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).get(
      `/packages/${randomUUID()}`
    );

    expect(response.statusCode).toBe(401);
  });
});
