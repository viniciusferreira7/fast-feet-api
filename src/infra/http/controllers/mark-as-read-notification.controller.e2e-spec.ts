import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import {
  createAuthenticatedRecipientWithId,
  markAsReadNotification,
  seedNotification,
} from 'test/e2e/notification-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Mark As Read Notification (E2E)', () => {
  let app: INestApplication;
  let drizzleService: DrizzleService;
  let envService: EnvService;
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
    await loginAdmin(
      app,
      envService.get('ADMIN_ROOT_CPF'),
      envService.get('ADMIN_ROOT_PASSWORD'),
      apiToken
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('[PATCH] /notifications/:notificationId/read — should return 200 and set read_at', async () => {
    const { recipientId, accessToken } =
      await createAuthenticatedRecipientWithId(app, drizzleService, apiToken);

    const notificationId = await seedNotification(drizzleService, {
      recipientId,
      title: 'Package picked up',
      content: 'Your package has been picked up by the delivery person.',
    });

    const response = await markAsReadNotification(
      app,
      accessToken,
      notificationId
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.notification).toEqual(
      expect.objectContaining({
        id: notificationId,
        title: 'Package picked up',
        read_at: expect.any(String),
      })
    );
    expect(response.body.notification.read_at).not.toBeNull();
  });

  it('[PATCH] /notifications/:notificationId/read — should return 404 when notification not found', async () => {
    const { accessToken } = await createAuthenticatedRecipientWithId(
      app,
      drizzleService,
      apiToken
    );

    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await markAsReadNotification(app, accessToken, fakeId);

    expect(response.statusCode).toBe(404);
  });

  it('[PATCH] /notifications/:notificationId/read — should return 404 when notification belongs to another user', async () => {
    const { recipientId: ownerId } = await createAuthenticatedRecipientWithId(
      app,
      drizzleService,
      apiToken
    );

    const { accessToken: otherToken } =
      await createAuthenticatedRecipientWithId(app, drizzleService, apiToken);

    const notificationId = await seedNotification(drizzleService, {
      recipientId: ownerId,
      title: 'Private notification',
    });

    const response = await markAsReadNotification(
      app,
      otherToken,
      notificationId
    );

    expect(response.statusCode).toBe(404);
  });

  it('[PATCH] /notifications/:notificationId/read — should return 401 when no token is provided', async () => {
    const { recipientId } = await createAuthenticatedRecipientWithId(
      app,
      drizzleService,
      apiToken
    );

    const notificationId = await seedNotification(drizzleService, {
      recipientId,
    });

    const response = await request(app.getHttpServer()).patch(
      `/notifications/${notificationId}/read`
    );

    expect(response.statusCode).toBe(401);
  });
});
