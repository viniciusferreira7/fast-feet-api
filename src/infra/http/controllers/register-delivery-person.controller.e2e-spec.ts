import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { generate as generateCpf } from 'gerador-validador-cpf';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { users } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

const STRONG_PASSWORD = 'MyS3cur3P@ssw0rd!';

describe('Register Delivery Person (E2E)', () => {
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
    await app.close();
  });

  it('[POST] /delivery-people — should register a new delivery person and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-people')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Delivery',
        cpf: generateCpf(),
        email: `delivery-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.delivery_person).toEqual(
      expect.objectContaining({
        name: 'John Delivery',
        is_active: true,
      })
    );
  });

  it('[POST] /delivery-people — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-people')
      .send({
        name: 'John Delivery',
        cpf: generateCpf(),
        email: `delivery-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(401);
  });

  it('[POST] /delivery-people — should return 403 when requester is not an admin', async () => {
    const deliveryToken = jwt.sign({
      type: 'user',
      sub: adminId,
      role: 'delivery',
    });

    const response = await request(app.getHttpServer())
      .post('/delivery-people')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({
        name: 'John Delivery',
        cpf: generateCpf(),
        email: `delivery-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(403);
  });

  it('[POST] /delivery-people — should return 409 when email is already in use', async () => {
    const email = `dup-delivery-${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/delivery-people')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'First',
        cpf: generateCpf(),
        email,
        password: STRONG_PASSWORD,
      });

    const response = await request(app.getHttpServer())
      .post('/delivery-people')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Second',
        cpf: generateCpf(),
        email,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(409);
  });

  it('[POST] /delivery-people — should return 409 when CPF is already in use', async () => {
    const cpf = generateCpf();

    await request(app.getHttpServer())
      .post('/delivery-people')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'First',
        cpf,
        email: `first-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    const response = await request(app.getHttpServer())
      .post('/delivery-people')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Second',
        cpf,
        email: `second-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(409);
  });

  it('[POST] /delivery-people — should return 400 for invalid CPF', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-people')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Delivery',
        cpf: '00000000000',
        email: `delivery-${Date.now()}@example.com`,
        password: STRONG_PASSWORD,
      });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /delivery-people — should return 400 for a password that does not meet requirements', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-people')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Delivery',
        cpf: generateCpf(),
        email: `delivery-${Date.now()}@example.com`,
        password: 'weak',
      });

    expect(response.statusCode).toBe(400);
  });
});
