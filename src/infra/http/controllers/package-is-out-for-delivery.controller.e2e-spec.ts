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
  registerDeliveryPerson,
} from 'test/e2e/delivery-flow';
import {
  markPackageOutForDelivery,
  registerPackage,
} from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { packages } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Package Is Out For Delivery (E2E)', () => {
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

  it('[PATCH] /packages/:packageId/out-for-delivery — should return 200 when admin marks package as out for delivery', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { response: dpRes } = await registerDeliveryPerson(app, adminToken);
    const deliveryPersonId = dpRes.body.delivery_person.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    await drizzleService.db
      .update(packages)
      .set({ status: 'in_transit' })
      .where(eq(packages.id, packageId));

    const response = await markPackageOutForDelivery(
      app,
      adminToken,
      packageId,
      deliveryPersonId
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.package).toEqual(
      expect.objectContaining({
        id: packageId,
        status: 'out_for_delivery',
      })
    );
  });

  it('[PATCH] /packages/:packageId/out-for-delivery — should return 400 when package is in pending status', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { response: dpRes } = await registerDeliveryPerson(app, adminToken);
    const deliveryPersonId = dpRes.body.delivery_person.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    // Package stays in pending — cannot transition to out_for_delivery
    const response = await markPackageOutForDelivery(
      app,
      adminToken,
      packageId,
      deliveryPersonId
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /packages/:packageId/out-for-delivery — should return 404 when package does not exist', async () => {
    const { response: dpRes } = await registerDeliveryPerson(app, adminToken);
    const deliveryPersonId = dpRes.body.delivery_person.id as string;

    const response = await markPackageOutForDelivery(
      app,
      adminToken,
      randomUUID(),
      deliveryPersonId
    );

    expect(response.statusCode).toBe(404);
  });

  it('[PATCH] /packages/:packageId/out-for-delivery — should return 404 when delivery person does not exist', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    await drizzleService.db
      .update(packages)
      .set({ status: 'in_transit' })
      .where(eq(packages.id, packageId));

    const response = await markPackageOutForDelivery(
      app,
      adminToken,
      packageId,
      randomUUID()
    );

    expect(response.statusCode).toBe(404);
  });

  it('[PATCH] /packages/:packageId/out-for-delivery — should return 403 when requester is a delivery person', async () => {
    const { accessToken: deliveryToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        adminToken,
        apiToken
      );

    const response = await request(app.getHttpServer())
      .patch(`/packages/${randomUUID()}/out-for-delivery`)
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({ deliveryPersonId: randomUUID() });

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /packages/:packageId/out-for-delivery — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).patch(
      `/packages/${randomUUID()}/out-for-delivery`
    );

    expect(response.statusCode).toBe(401);
  });
});
