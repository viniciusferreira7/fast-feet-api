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
  fetchNotifications,
  markManyNotificationsAsRead,
  seedNotification,
} from 'test/e2e/notification-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Mark Many Notifications As Read (E2E)', () => {
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

  it('[PATCH] /notifications/read — should mark all notifications as read with mark_all', async () => {
    const { recipientId, accessToken } =
      await createAuthenticatedRecipientWithId(app, drizzleService, apiToken);

    await Promise.all([
      seedNotification(drizzleService, { recipientId, title: 'Notif A' }),
      seedNotification(drizzleService, { recipientId, title: 'Notif B' }),
      seedNotification(drizzleService, { recipientId, title: 'Notif C' }),
    ]);

    const response = await markManyNotificationsAsRead(app, accessToken, {
      mark_all: true,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Notifications marked as read');

    const listResponse = await fetchNotifications(app, accessToken);
    const allRead = listResponse.body.notifications.every(
      (n: { read_at: string | null }) => n.read_at !== null
    );
    expect(allRead).toBe(true);
  });

  it('[PATCH] /notifications/read — should mark specific notifications as read with notifications_ids', async () => {
    const { recipientId, accessToken } =
      await createAuthenticatedRecipientWithId(app, drizzleService, apiToken);

    const [idA, idB] = await Promise.all([
      seedNotification(drizzleService, { recipientId, title: 'Target A' }),
      seedNotification(drizzleService, { recipientId, title: 'Target B' }),
      seedNotification(drizzleService, {
        recipientId,
        title: 'Should stay unread',
      }),
    ]);

    const response = await markManyNotificationsAsRead(app, accessToken, {
      notifications_ids: [idA, idB],
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Notifications marked as read');
  });

  it('[PATCH] /notifications/read — should return 400 when neither notifications_ids nor mark_all is provided', async () => {
    const { accessToken } = await createAuthenticatedRecipientWithId(
      app,
      drizzleService,
      apiToken
    );

    const response = await markManyNotificationsAsRead(app, accessToken, {});

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /notifications/read — should return 400 when notifications_ids has fewer than 2 items', async () => {
    const { recipientId, accessToken } =
      await createAuthenticatedRecipientWithId(app, drizzleService, apiToken);

    const notificationId = await seedNotification(drizzleService, {
      recipientId,
    });

    const response = await markManyNotificationsAsRead(app, accessToken, {
      notifications_ids: [notificationId],
    });

    expect(response.statusCode).toBe(400);
  });

  it('[PATCH] /notifications/read — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .patch('/notifications/read')
      .send({ mark_all: true });

    expect(response.statusCode).toBe(401);
  });
});
