import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { waitFor } from 'test/utils/wait-for';
import { beforeEach, MockInstance } from 'vitest';
import {
  SendNotificationUseCase,
  SendNotificationUseCaseRequest,
  SendNotificationUseCaseResponse,
} from '../application/use-cases/send-notification';
import { OnPackageAssignedSendNotification } from './on-package-assigned-send-notification';

let packagesRepository: InMemoryPackagesRepository;
let packagesHistoryRepository: InMemoryPackagesHistoryRepository;
let notificationsRepository: InMemoryNotificationsRepository;

let sendNotificationUseCase: SendNotificationUseCase;

let sendNotificationSpy: MockInstance<
  (
    request: SendNotificationUseCaseRequest
  ) => Promise<SendNotificationUseCaseResponse>
>;

describe('On package assigned to a delivery person', () => {
  beforeEach(() => {
    packagesHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packagesHistoryRepository
    );

    notificationsRepository = new InMemoryNotificationsRepository();

    sendNotificationUseCase = new SendNotificationUseCase(
      notificationsRepository
    );

    sendNotificationSpy = vi.spyOn(sendNotificationUseCase, 'execute');

    const _onPackageAssignedSendNotification =
      new OnPackageAssignedSendNotification(
        packagesRepository,
        sendNotificationUseCase
      );
  });

  it('should sent notification when a package is assigned to a delivery person', async () => {
    const packageRecord = makePackage({
      deliveryPersonId: null,
    });

    await packagesRepository.register(packageRecord);

    const adminPerson = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    packageRecord.assignDeliveryPerson(
      deliveryPerson.id,
      adminPerson.id,
      packageRecord.status,
      'On package assigned to a delivery person'
    );

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith({
        title: 'On package assigned to a delivery person',
        content: `Delivery person was assigned to get a package: ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        }, the package code is: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId.toString(),
      });
    });

    const notification = await notificationsRepository.items.find(
      (item) => item.title === 'On package assigned to a delivery person'
    );

    expect(notification).toEqual(
      expect.objectContaining({
        title: 'On package assigned to a delivery person',
        content: `Delivery person was assigned to get a package: ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        }, the package code is: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId,
        createdAt: expect.any(Date),
      })
    );
  });
});
