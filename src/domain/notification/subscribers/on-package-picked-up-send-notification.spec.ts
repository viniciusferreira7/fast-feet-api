import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { waitFor } from 'test/utils/wait-for';
import { beforeEach, MockInstance } from 'vitest';
import { PackageStatus } from '@/domain/delivery/enterprise/entities/value-object/package-status';
import {
  SendNotificationUseCase,
  SendNotificationUseCaseRequest,
  SendNotificationUseCaseResponse,
} from '../application/use-cases/send-notification';
import { OnPackagePickedUpSendNotification } from './on-package-picked-up-send-notification';

let packagesRepository: InMemoryPackagesRepository;
let packagesHistoryRepository: InMemoryPackagesHistoryRepository;
let notificationsRepository: InMemoryNotificationsRepository;

let sendNotificationUseCase: SendNotificationUseCase;

let sendNotificationSpy: MockInstance<
  (
    request: SendNotificationUseCaseRequest
  ) => Promise<SendNotificationUseCaseResponse>
>;

describe('On package picked up', () => {
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

    const _onPackagePickedUpSendNotification =
      new OnPackagePickedUpSendNotification(
        packagesRepository,
        sendNotificationUseCase
      );
  });

  it('should send notification when a package is picked up', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageRecord = makePackage({
      status: awaitingPickupStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await packagesRepository.register(packageRecord);

    packageRecord.markAsPickedUp(deliveryPerson.id);

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith({
        title: 'Package picked up',
        content: `Delivery person was picked up to get a package: ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        }, the package code is: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId.toString(),
      });
    });

    const notification = notificationsRepository.items.find(
      (item) => item.title === 'Package picked up'
    );

    expect(notification).toEqual(
      expect.objectContaining({
        title: 'Package picked up',
        content: `Delivery person was picked up to get a package: ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        }, the package code is: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId,
        createdAt: expect.any(Date),
      })
    );
  });

  it('should NOT call sendNotification when package is registered without pick-up', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageRecord = makePackage({
      status: awaitingPickupStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await packagesRepository.register(packageRecord);
    // No markAsPickedUp call

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });

  it('should truncate package names longer than 10 characters in notification content', async () => {
    const longName = 'VeryLongPackageName';
    const deliveryPerson = makeDeliveryPerson();
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageRecord = makePackage({
      name: longName,
      status: awaitingPickupStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await packagesRepository.register(packageRecord);

    packageRecord.markAsPickedUp(deliveryPerson.id);
    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
    });

    const [callArg] = sendNotificationSpy.mock.calls[0];
    expect(callArg.content).toContain('VeryLongPa...');
  });

  it('should fire exactly once per pick-up', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageRecord = makePackage({
      status: awaitingPickupStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await packagesRepository.register(packageRecord);

    packageRecord.markAsPickedUp(deliveryPerson.id);
    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
    });

    expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
  });
});
