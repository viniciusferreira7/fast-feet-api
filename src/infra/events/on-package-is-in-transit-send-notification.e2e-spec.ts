import { type INestApplication } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import { registerDeliveryPerson } from 'test/e2e/delivery-flow';
import { markPackageInTransit, registerPackage } from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { waitFor } from 'test/utils/wait-for';
import { DomainEvents } from '@/core/events/domain-events';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { notifications, packages } from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('On Package Is In Transit (E2E)', () => {
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

  it('should send a notification when a package is marked as in transit', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const { response: dpRes } = await registerDeliveryPerson(app, adminToken);
    const dpId = dpRes.body.delivery_person.id as string;

    const { packageId, packageCode } = await registerPackage(app, adminToken, {
      recipientId,
      name: 'Camera Pro',
    });

    await drizzleService.db
      .update(packages)
      .set({ status: 'at_distribution_center', deliveryPersonId: dpId })
      .where(eq(packages.id, packageId));

    const response = await markPackageInTransit(
      app,
      adminToken,
      packageId,
      dpId,
      { description: 'Loaded onto truck' }
    );

    expect(response.statusCode).toBe(200);

    await waitFor(async () => {
      const [notification] = await drizzleService.db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientId, recipientId),
            eq(notifications.title, 'Loaded onto truck')
          )
        );

      expect(notification).toBeDefined();
      expect(notification.content).toBe(
        `A delivery person has been assigned to pick up your package Camera Pro. Package code: ${packageCode}`
      );
    });
  });
});
