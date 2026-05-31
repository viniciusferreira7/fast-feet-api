import { type INestApplication } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { registerPackage, updatePackage } from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { waitFor } from 'test/utils/wait-for';
import { DomainEvents } from '@/core/events/domain-events';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { notifications } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('On Package Was Updated (E2E)', () => {
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

    DomainEvents.shouldRun = true;
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
    DomainEvents.shouldRun = false;
    await app.close();
  });

  it('should send a notification when a package is updated', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { packageId, packageCode } = await registerPackage(app, adminToken, {
      recipientId,
      name: 'Original Name',
    });

    const response = await updatePackage(app, adminToken, packageId, {
      name: 'Updated Name',
      recipientAddress: 'Rua Atualizada, 123',
      description: 'Address corrected',
    });

    expect(response.statusCode).toBe(200);

    await waitFor(async () => {
      const [notification] = await drizzleService.db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientId, recipientId),
            eq(notifications.title, 'Address corrected')
          )
        );

      expect(notification).toBeDefined();
      expect(notification.content).toBe(
        `Your package Updated Na.... Package code: ${packageCode}`
      );
    });
  });
});
