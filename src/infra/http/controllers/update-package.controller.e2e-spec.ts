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
import { registerPackage, updatePackage } from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Update Package (E2E)', () => {
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

  it('[PUT] /packages/:packageId — should return 200 when admin updates name and recipientAddress', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
      name: 'Original Name',
      recipientAddress: 'Original Address, 1, São Paulo - SP',
    });

    const response = await updatePackage(app, adminToken, packageId, {
      name: 'Updated Name',
      recipientAddress: 'Updated Address, 2, Rio de Janeiro - RJ',
    });

    expect(response.statusCode).toBe(200);
  });

  it('[PUT] /packages/:packageId — should return 200 with updated fields in response', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
      name: 'Before Update',
      recipientAddress: 'Before Address, 1, São Paulo - SP',
    });

    const updatedName = 'After Update';
    const updatedAddress = 'After Address, 99, Curitiba - PR';

    const response = await updatePackage(app, adminToken, packageId, {
      name: updatedName,
      recipientAddress: updatedAddress,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.package).toEqual(
      expect.objectContaining({
        id: packageId,
        name: updatedName,
        recipient_address: updatedAddress,
      })
    );
  });

  it('[PUT] /packages/:packageId — should return 404 when package does not exist', async () => {
    const response = await updatePackage(app, adminToken, randomUUID(), {
      name: 'Some Name',
      recipientAddress: 'Some Address, 1, São Paulo - SP',
    });

    expect(response.statusCode).toBe(404);
  });

  it('[PUT] /packages/:packageId — should return 403 when requester is a delivery person', async () => {
    const { accessToken: deliveryToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        adminToken,
        apiToken
      );

    const response = await request(app.getHttpServer())
      .put(`/packages/${randomUUID()}`)
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({
        name: 'Updated Name',
        recipientAddress: 'Updated Address, 1, São Paulo - SP',
      });

    expect(response.statusCode).toBe(403);
  });

  it('[PUT] /packages/:packageId — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .put(`/packages/${randomUUID()}`)
      .send({
        name: 'Updated Name',
        recipientAddress: 'Updated Address, 1, São Paulo - SP',
      });

    expect(response.statusCode).toBe(401);
  });
});
