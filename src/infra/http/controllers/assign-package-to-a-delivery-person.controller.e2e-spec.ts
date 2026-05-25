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
import { registerDeliveryPerson } from 'test/e2e/delivery-flow';
import {
  assignPackageToDeliveryPerson,
  registerPackage,
} from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Assign Package To A Delivery Person (E2E)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let adminId: string;
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

    const [admin] = await drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, rootEmail));

    adminId = admin.id;

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

  it('[PATCH] /packages/:packageId — should assign a package and return 200', async () => {
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

    const response = await assignPackageToDeliveryPerson(
      app,
      adminToken,
      packageId,
      deliveryPersonId,
      'Fragile item, handle with care'
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.package).toEqual(
      expect.objectContaining({
        id: packageId,
        delivery_person_id: deliveryPersonId,
        status: 'awaiting_pickup',
      })
    );
  });

  it('[PATCH] /packages/:packageId — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/packages/${randomUUID()}`)
      .send({
        deliveryPersonId: randomUUID(),
        description: 'Some description',
      });

    expect(response.statusCode).toBe(401);
  });

  it('[PATCH] /packages/:packageId — should return 403 when requester is not an admin', async () => {
    const deliveryToken = jwt.sign({
      type: 'user',
      sub: adminId,
      role: 'delivery',
    });

    const response = await request(app.getHttpServer())
      .patch(`/packages/${randomUUID()}`)
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({
        deliveryPersonId: randomUUID(),
        description: 'Some description',
      });

    expect(response.statusCode).toBe(403);
  });

  it('[PATCH] /packages/:packageId — should return 404 when package does not exist', async () => {
    const { response: deliveryRes } = await registerDeliveryPerson(
      app,
      adminToken
    );
    const deliveryPersonId = deliveryRes.body.delivery_person.id as string;

    const response = await assignPackageToDeliveryPerson(
      app,
      adminToken,
      randomUUID(),
      deliveryPersonId
    );

    expect(response.statusCode).toBe(404);
  });

  it('[PATCH] /packages/:packageId — should return 404 when delivery person does not exist', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId } = await registerPackage(app, adminToken, {
      recipientId,
    });

    const response = await assignPackageToDeliveryPerson(
      app,
      adminToken,
      packageId,
      randomUUID()
    );

    expect(response.statusCode).toBe(404);
  });

  it('[PATCH] /packages/:packageId — should return 400 when package is already assigned (invalid status transition)', async () => {
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

    const response = await assignPackageToDeliveryPerson(
      app,
      adminToken,
      packageId,
      deliveryPersonId
    );

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /packages/:packageId — should return 400 when body is missing required fields', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/packages/${randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /packages/:packageId — should return 400 when description is empty', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/packages/${randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        deliveryPersonId: randomUUID(),
        description: '   ',
      });

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /packages/:packageId — should return 400 when deliveryPersonId is not a valid UUID', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/packages/${randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        deliveryPersonId: 'not-a-uuid',
        description: 'Some description',
      });

    expect(response.statusCode).toBe(400);
  });
});
