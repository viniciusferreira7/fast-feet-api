import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { registerDeliveryPerson } from 'test/e2e/delivery-flow';
import {
  assignPackageToDeliveryPerson,
  registerPackage,
  trackPackageByCode,
} from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Get Package By Code (E2E)', () => {
  let app: INestApplication;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let adminToken: string;
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
    try {
      await app.close();
    } catch (error) {
      console.log({ error });
    }
  });

  it('[GET] /packages/track/:code — should return 200 with public package data', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageCode } = await registerPackage(app, adminToken, {
      recipientId,
      name: 'Smartphone Galaxy S24',
      recipientAddress: 'Av. Paulista, 1000, São Paulo - SP',
      postalCode: '01310-100',
    });

    const response = await trackPackageByCode(app, packageCode, apiToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.package).toEqual(
      expect.objectContaining({
        code: packageCode,
        name: 'Smartphone Galaxy S24',
        status: 'pending',
        recipient_address: 'Av. Paulista, 1000, São Paulo - SP',
      })
    );
  });

  it('[GET] /packages/track/:code — should not expose sensitive fields', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageCode } = await registerPackage(app, adminToken, {
      recipientId,
    });

    const response = await trackPackageByCode(app, packageCode, apiToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.package).not.toHaveProperty('id');
    expect(response.body.package).not.toHaveProperty('recipient_id');
    expect(response.body.package).not.toHaveProperty('author_id');
    expect(response.body.package).not.toHaveProperty('delivery_person_id');
    expect(response.body.package).not.toHaveProperty('postal_code');
    expect(response.body.package).not.toHaveProperty('created_at');
  });

  it('[GET] /packages/track/:code — should reflect updated status after assignment', async () => {
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

    const { packageId, packageCode } = await registerPackage(app, adminToken, {
      recipientId,
    });

    await assignPackageToDeliveryPerson(
      app,
      adminToken,
      packageId,
      deliveryPersonId
    );

    const response = await trackPackageByCode(app, packageCode, apiToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.package.status).toBe('awaiting_pickup');
  });

  it('[GET] /packages/track/:code — should return 404 for a non-existent code', async () => {
    const response = await trackPackageByCode(
      app,
      '01AAAAAAAAAAAAAAAAAAAAAAAAA',
      apiToken
    );

    expect(response.statusCode).toBe(404);
  });

  it('[GET] /packages/track/:code — should return 401 when no API key is provided', async () => {
    const response = await request(app.getHttpServer()).get(
      '/packages/track/01AAAAAAAAAAAAAAAAAAAAAAAAA'
    );

    expect(response.statusCode).toBe(401);
  });
});
