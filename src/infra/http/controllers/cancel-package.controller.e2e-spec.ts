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
  assignPackageToDeliveryPerson,
  cancelPackage,
  registerPackage,
} from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { packages } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Cancel Package (E2E)', () => {
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

  it('[PATCH] /packages/:packageId/cancel — should return 204 when cancelling a pending package', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    const response = await cancelPackage(app, adminToken, packageId);

    expect(response.statusCode).toBe(204);
  });

  it('[PATCH] /packages/:packageId/cancel — should return 204 with an optional description', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    const response = await cancelPackage(app, adminToken, packageId, {
      description: 'Customer requested cancellation of this order.',
    });

    expect(response.statusCode).toBe(204);
  });

  it('[PATCH] /packages/:packageId/cancel — should return 204 when cancelling an awaiting_pickup package', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { response: deliveryRes } = await registerDeliveryPerson(
      app,
      adminToken
    );
    const deliveryPersonId = deliveryRes.body.delivery_person.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    await assignPackageToDeliveryPerson(
      app,
      adminToken,
      packageId,
      deliveryPersonId
    );

    const response = await cancelPackage(app, adminToken, packageId);

    expect(response.statusCode).toBe(204);
  });

  it('[PATCH] /packages/:packageId/cancel — should return 400 when description is too short', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    const response = await cancelPackage(app, adminToken, packageId, {
      description: 'short',
    });

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /packages/:packageId/cancel — should return 400 when package is already cancelled', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    await cancelPackage(app, adminToken, packageId);

    const response = await cancelPackage(app, adminToken, packageId);

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /packages/:packageId/cancel — should return 400 when status does not allow cancellation', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    // Force the package into 'delivered' state — cannot transition to 'canceled'
    await drizzleService.db
      .update(packages)
      .set({ status: 'delivered' })
      .where(eq(packages.id, packageId));

    const response = await cancelPackage(app, adminToken, packageId);

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /packages/:packageId/cancel — should return 404 when package does not exist', async () => {
    const response = await cancelPackage(app, adminToken, randomUUID());

    expect(response.statusCode).toBe(404);
  });

  it('[PATCH] /packages/:packageId/cancel — should return 403 when requester is a delivery person', async () => {
    const { accessToken: deliveryToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        adminToken,
        apiToken
      );

    const response = await request(app.getHttpServer())
      .patch(`/packages/${randomUUID()}/cancel`)
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({});

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /packages/:packageId/cancel — should return 403 when requester is a recipient', async () => {
    const recipientToken = jwt.sign({
      type: 'user',
      sub: randomUUID(),
      role: 'recipient',
    });

    const response = await request(app.getHttpServer())
      .patch(`/packages/${randomUUID()}/cancel`)
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({});

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /packages/:packageId/cancel — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).patch(
      `/packages/${randomUUID()}/cancel`
    );

    expect(response.statusCode).toBe(401);
  });
});
