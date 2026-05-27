import multipart from '@fastify/multipart';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { createAuthenticatedDeliveryPerson } from 'test/e2e/delivery-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { FakeUploader } from 'test/storage/fake-uploader';
import { Uploader } from '@/domain/delivery/application/storage/uploader';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Upload and Create Attachment (E2E)', () => {
  let app: INestApplication;
  let drizzleService: DrizzleService;
  let envService: EnvService;
  let adminToken: string;
  let apiToken: string;
  let fakeUploader: FakeUploader;

  beforeAll(async () => {
    fakeUploader = new FakeUploader();

    const moduleRef = await makeModuleRef((builder) =>
      builder.overrideProvider(Uploader).useValue(fakeUploader)
    );

    app = await startApp(moduleRef, {
      beforeInit: async (fastifyApp) => {
        await fastifyApp.register(multipart, {
          limits: { fileSize: 10 * 1024 * 1024 },
        });
      },
    });

    drizzleService = moduleRef.get(DrizzleService);
    envService = moduleRef.get(EnvService);
  });

  beforeEach(async () => {
    fakeUploader.uploads = [];

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

  it('[POST] /upload — should return 201 with attachment when uploading a valid JPEG', async () => {
    const { accessToken: deliveryToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        adminToken,
        apiToken
      );

    const response = await request(app.getHttpServer())
      .post('/upload')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .attach('file', Buffer.from('fake-jpeg-content'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.attachment).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: 'photo.jpg',
        url: expect.any(String),
      })
    );
    expect(fakeUploader.uploads).toHaveLength(1);
    expect(fakeUploader.uploads[0].fileName).toBe('photo.jpg');
  });

  it('[POST] /upload — should return 201 with attachment when uploading a valid PNG', async () => {
    const { accessToken: deliveryToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        adminToken,
        apiToken
      );

    const response = await request(app.getHttpServer())
      .post('/upload')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .attach('file', Buffer.from('fake-png-content'), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.attachment).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: 'photo.png',
        url: expect.any(String),
      })
    );
  });

  it('[POST] /upload — should return 400 when file type is not JPEG or PNG', async () => {
    const { accessToken: deliveryToken } =
      await createAuthenticatedDeliveryPerson(
        app,
        drizzleService,
        adminToken,
        apiToken
      );

    const response = await request(app.getHttpServer())
      .post('/upload')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .attach('file', Buffer.from('%PDF-1.4 fake content'), {
        filename: 'document.pdf',
        contentType: 'application/pdf',
      });

    expect(response.statusCode).toBe(400);
  });

  it('[POST] /upload — should return 403 when requester is an admin', async () => {
    const response = await request(app.getHttpServer())
      .post('/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('fake-jpeg-content'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.statusCode).toBe(403);
  });

  it('[POST] /upload — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.from('fake-jpeg-content'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.statusCode).toBe(401);
  });
});
