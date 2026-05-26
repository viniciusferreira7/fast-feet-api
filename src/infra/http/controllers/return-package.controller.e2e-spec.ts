import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import {
  createAuthenticatedDeliveryPerson,
  getDeliveryEmailCode,
  loginDeliveryPerson,
  registerDeliveryPerson,
  sendDeliveryCode,
  validateDeliveryCode,
} from 'test/e2e/delivery-flow';
import { registerPackage, returnPackage } from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { packages } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Return Package (E2E)', () => {
  let app: INestApplication;
  let _jwt: JwtService;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let adminToken: string;
  let apiToken: string;

  beforeAll(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    _jwt = moduleRef.get(JwtService);
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

  it('[PATCH] /packages/:packageId/return — should return 200 when delivery person returns a failed-delivery package', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const dpEmail = `return-dp-${Date.now()}@example.com`;
    const {
      response: dpRes,
      cpf: dpCpf,
      password: dpPassword,
    } = await registerDeliveryPerson(app, adminToken, { email: dpEmail });
    const dpId = dpRes.body.delivery_person.id as string;

    await sendDeliveryCode(app, dpEmail, apiToken);
    const dpCode = await getDeliveryEmailCode(drizzleService, dpEmail);
    await validateDeliveryCode(app, dpEmail, dpCode, apiToken);
    const dpToken = await loginDeliveryPerson(app, dpCpf, dpPassword, apiToken);

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    await drizzleService.db
      .update(packages)
      .set({ status: 'failed_delivery', deliveryPersonId: dpId })
      .where(eq(packages.id, packageId));

    const response = await returnPackage(app, dpToken, packageId);

    expect(response.statusCode).toBe(200);
    expect(response.body.package).toEqual(
      expect.objectContaining({
        id: packageId,
        status: 'returned',
      })
    );
  });

  it('[PATCH] /packages/:packageId/return — should return 400 when package is in pending status', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { accessToken: deliveryToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        adminToken,
        apiToken
      );

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    // Package stays in pending — cannot transition to returned
    const response = await returnPackage(app, deliveryToken, packageId);

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /packages/:packageId/return — should return 404 when package does not exist', async () => {
    const { accessToken: deliveryToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        adminToken,
        apiToken
      );

    const response = await returnPackage(app, deliveryToken, randomUUID());

    expect(response.statusCode).toBe(404);
  });

  it('[PATCH] /packages/:packageId/return — should return 403 when requester is an admin', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/packages/${randomUUID()}/return`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /packages/:packageId/return — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).patch(
      `/packages/${randomUUID()}/return`
    );

    expect(response.statusCode).toBe(401);
  });
});
