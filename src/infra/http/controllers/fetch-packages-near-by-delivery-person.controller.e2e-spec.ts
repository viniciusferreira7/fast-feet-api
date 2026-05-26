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
import { registerDeliveryPerson } from 'test/e2e/delivery-flow';
import {
  assignPackageToDeliveryPerson,
  fetchPackagesNearBy,
  registerPackage,
} from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

// Postal codes that share the same first-5-character prefix ("01310")
// so findNearBy will match them against each other.
const PACKAGE_POSTAL_CODE = '01310-100';
const SEARCH_POSTAL_CODE = '01310-200';

describe('Fetch Packages Near By Delivery Person (E2E)', () => {
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

  it('[GET] /delivery-people/:id/packages — should return 200 with paginated structure', async () => {
    const { response: deliveryRes } = await registerDeliveryPerson(
      app,
      adminToken
    );
    const deliveryPersonId = deliveryRes.body.delivery_person.id as string;

    const response = await fetchPackagesNearBy(
      app,
      adminToken,
      deliveryPersonId,
      SEARCH_POSTAL_CODE
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        page: expect.any(Number),
        total_pages: expect.any(Number),
        per_page: expect.any(Number),
        packages: expect.any(Array),
      })
    );
  });

  it('[GET] /delivery-people/:id/packages — should return packages matching postal code prefix', async () => {
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
      postalCode: PACKAGE_POSTAL_CODE,
    });

    await assignPackageToDeliveryPerson(
      app,
      adminToken,
      packageId,
      deliveryPersonId
    );

    const response = await fetchPackagesNearBy(
      app,
      adminToken,
      deliveryPersonId,
      SEARCH_POSTAL_CODE
    );

    expect(response.statusCode).toBe(200);
    expect(
      response.body.packages.some((p: { id: string }) => p.id === packageId)
    ).toBe(true);
  });

  it('[GET] /delivery-people/:id/packages — should return 200 with empty list when no packages match', async () => {
    const { response: deliveryRes } = await registerDeliveryPerson(
      app,
      adminToken
    );
    const deliveryPersonId = deliveryRes.body.delivery_person.id as string;

    // Postal code with a completely different prefix — no packages will match
    const response = await fetchPackagesNearBy(
      app,
      adminToken,
      deliveryPersonId,
      '99999-000'
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.packages).toEqual([]);
  });

  it('[GET] /delivery-people/:id/packages — should respect per_page pagination', async () => {
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

    await Promise.all([
      registerPackage(app, adminToken, {
        recipientId,
        postalCode: PACKAGE_POSTAL_CODE,
      }),
      registerPackage(app, adminToken, {
        recipientId,
        postalCode: PACKAGE_POSTAL_CODE,
      }),
      registerPackage(app, adminToken, {
        recipientId,
        postalCode: PACKAGE_POSTAL_CODE,
      }),
    ]);

    const response = await fetchPackagesNearBy(
      app,
      adminToken,
      deliveryPersonId,
      SEARCH_POSTAL_CODE,
      { page: 1, perPage: 1 }
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.packages.length).toBeLessThanOrEqual(1);
    expect(response.body.per_page).toBe(1);
  });

  it('[GET] /delivery-people/:id/packages — should return 400 when postal_code is missing', async () => {
    const { response: deliveryRes } = await registerDeliveryPerson(
      app,
      adminToken
    );
    const deliveryPersonId = deliveryRes.body.delivery_person.id as string;

    const response = await request(app.getHttpServer())
      .get(`/delivery-people/${deliveryPersonId}/packages`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(400);
  });

  it('[GET] /delivery-people/:id/packages — should return 400 when delivery person does not exist', async () => {
    const response = await fetchPackagesNearBy(
      app,
      adminToken,
      randomUUID(),
      SEARCH_POSTAL_CODE
    );

    expect(response.statusCode).toBe(400);
  });

  it('[GET] /delivery-people/:id/packages — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).get(
      `/delivery-people/${randomUUID()}/packages?postal_code=${SEARCH_POSTAL_CODE}`
    );

    expect(response.statusCode).toBe(401);
  });

  it('[GET] /delivery-people/:id/packages — should return 403 when requester is a recipient', async () => {
    const recipientToken = jwt.sign({
      type: 'user',
      sub: randomUUID(),
      role: 'recipient',
    });

    const response = await request(app.getHttpServer())
      .get(
        `/delivery-people/${randomUUID()}/packages?postal_code=${SEARCH_POSTAL_CODE}`
      )
      .set('Authorization', `Bearer ${recipientToken}`);

    expect(response.statusCode).toBe(403);
  });
});
