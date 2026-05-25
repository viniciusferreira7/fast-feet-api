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
import { registerPackage } from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('Register Package (E2E)', () => {
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

  it('[POST] /packages — should register a package with a delivery person and return 201', async () => {
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

    const { response } = await registerPackage(app, adminToken, {
      recipientId,
      name: 'Smartphone Galaxy S24',
      recipientAddress: 'Av. Paulista, 1000, São Paulo - SP',
      postalCode: '01310-100',
      deliveryPersonId,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.package).toEqual(
      expect.objectContaining({
        name: 'Smartphone Galaxy S24',
        recipient_id: recipientId,
        delivery_person_id: deliveryPersonId,
        status: 'pending',
        postal_code: '01310-100',
      })
    );
    expect(response.body.package.id).toBeDefined();
    expect(response.body.package.code).toBeDefined();
  });

  it('[POST] /packages — should register a package without a delivery person and return 201', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { response } = await registerPackage(app, adminToken, {
      recipientId,
      name: 'Notebook Dell XPS',
      recipientAddress: 'Rua das Flores, 200, Curitiba - PR',
      postalCode: '80010-020',
      deliveryPersonId: null,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.package).toEqual(
      expect.objectContaining({
        name: 'Notebook Dell XPS',
        recipient_id: recipientId,
        delivery_person_id: null,
        status: 'pending',
      })
    );
    expect(response.body.package.id).toBeDefined();
    expect(response.body.package.code).toBeDefined();
  });

  it('[POST] /packages — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).post('/packages').send({
      recipientId: randomUUID(),
      name: 'Some Package',
      recipientAddress: 'Some Address',
      postalCode: '01310-100',
      deliveryPersonId: null,
    });

    expect(response.statusCode).toBe(401);
  });

  it('[POST] /packages — should return 403 when requester is not an admin', async () => {
    const deliveryToken = jwt.sign({
      type: 'user',
      sub: adminId,
      role: 'delivery',
    });

    const response = await request(app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({
        recipientId: randomUUID(),
        name: 'Some Package',
        recipientAddress: 'Some Address',
        postalCode: '01310-100',
        deliveryPersonId: null,
      });

    expect(response.statusCode).toBe(403);
  });

  it('[POST] /packages — should return 400 when the recipient does not exist', async () => {
    const response = await request(app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipientId: randomUUID(),
        name: 'Ghost Package',
        recipientAddress: 'Some Address',
        postalCode: '01310-100',
        deliveryPersonId: null,
      });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /packages — should return 400 when the delivery person does not exist', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const response = await request(app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipientId,
        name: 'Some Package',
        recipientAddress: 'Av. Paulista, 1000, São Paulo - SP',
        postalCode: '01310-100',
        deliveryPersonId: randomUUID(),
      });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /packages — should return 400 for missing required fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete Package' });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /packages — should return 400 when recipientId is not a valid UUID', async () => {
    const response = await request(app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipientId: 'not-a-uuid',
        name: 'Some Package',
        recipientAddress: 'Some Address',
        postalCode: '01310-100',
        deliveryPersonId: null,
      });

    expect(response.statusCode).toBe(400);
  });
});
