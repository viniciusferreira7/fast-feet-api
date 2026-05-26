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
import { OnPackageAssignedToADeliveryPersonSendNotification } from './on-package-assigned-send-notification';

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

    const _OnPackageAssignedToADeliveryPersonSendNotification =
      new OnPackageAssignedToADeliveryPersonSendNotification(
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

  it('should NOT call sendNotification when no delivery person is assigned', async () => {
    const packageRecord = makePackage({ deliveryPersonId: null });
    await packagesRepository.register(packageRecord);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });

  it('should truncate package names longer than 10 characters in notification content', async () => {
    const longName = 'VeryLongPackageName';
    const packageRecord = makePackage({
      name: longName,
      deliveryPersonId: null,
    });
    await packagesRepository.register(packageRecord);

    const adminPerson = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    packageRecord.assignDeliveryPerson(
      deliveryPerson.id,
      adminPerson.id,
      'Assigning'
    );
    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
    });

    const [callArg] = sendNotificationSpy.mock.calls[0];
    expect(callArg.content).toContain('VeryLongPa...');
  });

  it('should fire exactly once per assignment', async () => {
    const packageRecord = makePackage({ deliveryPersonId: null });
    await packagesRepository.register(packageRecord);

    const adminPerson = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    packageRecord.assignDeliveryPerson(
      deliveryPerson.id,
      adminPerson.id,
      'First assignment'
    );
    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
    });

    expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
  });
});
