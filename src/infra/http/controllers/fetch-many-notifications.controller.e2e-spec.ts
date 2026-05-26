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
  seedNotification,
} from 'test/e2e/notification-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EnvService } from '@/infra/env/env.service';

describe('Fetch Many Notifications (E2E)', () => {
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
    await app.close();
  });

  it('[GET] /notifications — should return 200 with paginated notifications', async () => {
    const { recipientId, accessToken } =
      await createAuthenticatedRecipientWithId(app, drizzleService, apiToken);

    await seedNotification(drizzleService, {
      recipientId,
      title: 'Your package has been registered',
      content: 'Package PKG-001 is now being processed.',
    });

    const response = await fetchNotifications(app, accessToken);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        page: expect.any(Number),
        total_pages: expect.any(Number),
        per_page: expect.any(Number),
        notifications: expect.any(Array),
      })
    );
    expect(response.body.notifications.length).toBeGreaterThan(0);
  });

  it('[GET] /notifications — should only return notifications for the current user', async () => {
    const { recipientId: recipientAId, accessToken: tokenA } =
      await createAuthenticatedRecipientWithId(app, drizzleService, apiToken);

    const { recipientId: recipientBId } =
      await createAuthenticatedRecipientWithId(app, drizzleService, apiToken);

    await seedNotification(drizzleService, {
      recipientId: recipientAId,
      title: 'Notification for A',
    });
    await seedNotification(drizzleService, {
      recipientId: recipientBId,
      title: 'Notification for B',
    });

    const response = await fetchNotifications(app, tokenA);

    expect(response.statusCode).toBe(200);
    const titles = response.body.notifications.map(
      (n: { title: string }) => n.title
    );
    expect(titles).toContain('Notification for A');
    expect(titles).not.toContain('Notification for B');
  });

  it('[GET] /notifications — should filter by search term', async () => {
    const { recipientId, accessToken } =
      await createAuthenticatedRecipientWithId(app, drizzleService, apiToken);

    const uniqueTitle = `UniquePkg${Date.now()}`;
    await seedNotification(drizzleService, {
      recipientId,
      title: uniqueTitle,
    });
    await seedNotification(drizzleService, {
      recipientId,
      title: 'Other Notification',
    });

    const response = await fetchNotifications(app, accessToken, {
      search: uniqueTitle,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.notifications).toHaveLength(1);
    expect(response.body.notifications[0].title).toBe(uniqueTitle);
  });

  it('[GET] /notifications — should respect per_page pagination', async () => {
    const { recipientId, accessToken } =
      await createAuthenticatedRecipientWithId(app, drizzleService, apiToken);

    await Promise.all([
      seedNotification(drizzleService, { recipientId, title: 'Notif 1' }),
      seedNotification(drizzleService, { recipientId, title: 'Notif 2' }),
      seedNotification(drizzleService, { recipientId, title: 'Notif 3' }),
    ]);

    const response = await fetchNotifications(app, accessToken, {
      page: 1,
      per_page: 2,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.notifications.length).toBeLessThanOrEqual(2);
    expect(response.body.per_page).toBe(2);
  });

  it('[GET] /notifications — should return 200 with empty list when user has no notifications', async () => {
    const { accessToken } = await createAuthenticatedRecipientWithId(
      app,
      drizzleService,
      apiToken
    );

    const response = await fetchNotifications(app, accessToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.notifications).toEqual([]);
  });

  it('[GET] /notifications — should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).get('/notifications');

    expect(response.statusCode).toBe(401);
  });

  it('[GET] /notifications — should return 200 for an admin user', async () => {
    const response = await fetchNotifications(app, adminToken);

    expect(response.statusCode).toBe(200);
  });
});
