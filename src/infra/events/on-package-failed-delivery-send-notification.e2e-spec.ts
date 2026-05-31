import { type INestApplication } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  getAdminEmailCode,
  loginAdmin,
  sendAdminCode,
  validateAdminCode,
} from 'test/e2e/admin-flow';
import {
  getDeliveryEmailCode,
  loginDeliveryPerson,
  registerDeliveryPerson,
  sendDeliveryCode,
  validateDeliveryCode,
} from 'test/e2e/delivery-flow';
import {
  markPackageFailedDelivery,
  registerPackage,
} from 'test/e2e/package-flow';
import { registerRecipientPerson } from 'test/e2e/recipient-flow';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { waitFor } from 'test/utils/wait-for';
import { DomainEvents } from '@/core/events/domain-events';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import {
  attachments,
  notifications,
  packages,
} from '@/infra/database/drizzle/schema';
import { EnvService } from '@/infra/env/env.service';

describe('On Package Failed Delivery (E2E)', () => {
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

  it('should send a notification when a delivery attempt fails', async () => {
    const { response: recipientRes } = await registerRecipientPerson(
      app,
      apiToken
    );
    const recipientId = recipientRes.body.recipient.id as string;

    const dpEmail = `failed-evt-${Date.now()}@example.com`;
    const {
      response: dpRes,
      cpf: dpCpf,
      password: dpPassword,
    } = await registerDeliveryPerson(app, adminToken, { email: dpEmail });
    const dpId = dpRes.body.delivery_person.id as string;

    await sendDeliveryCode(app, dpEmail, apiToken);
    const dpCode = await getDeliveryEmailCode(drizzleService, dpEmail);
    await validateDeliveryCode(app, dpEmail, dpCode, apiToken);
    const dpToken = await loginDeliveryPerson(app, dpCpf, dpPassword, apiToken);

    const { packageId, packageCode } = await registerPackage(app, adminToken, {
      recipientId,
      name: 'Watch',
    });

    await drizzleService.db
      .update(packages)
      .set({ status: 'out_for_delivery', deliveryPersonId: dpId })
      .where(eq(packages.id, packageId));

    const [att] = await drizzleService.db
      .insert(attachments)
      .values({
        title: 'proof.jpg',
        key: `failed-evt-${Date.now()}.jpg`,
      })
      .returning({ id: attachments.id });

    const response = await markPackageFailedDelivery(
      app,
      dpToken,
      packageId,
      att.id,
      { description: 'Recipient unavailable' }
    );

    expect(response.statusCode).toBe(200);

    await waitFor(async () => {
      const [notification] = await drizzleService.db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientId, recipientId),
            eq(notifications.title, 'Recipient unavailable')
          )
        );

      expect(notification).toBeDefined();
      expect(notification.content).toBe(
        `A delivery attempt was made for your package Watch but was unsuccessful. Package code: ${packageCode}`
      );
    });
  });
});
