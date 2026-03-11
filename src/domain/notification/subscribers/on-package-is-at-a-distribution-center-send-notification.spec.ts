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
import { OnPackageIsAtADistributionCenterSendNotification } from './on-package-is-at-a-distribution-center-send-notification';

let packagesRepository: InMemoryPackagesRepository;
let packagesHistoryRepository: InMemoryPackagesHistoryRepository;
let notificationsRepository: InMemoryNotificationsRepository;

let sendNotificationUseCase: SendNotificationUseCase;

let sendNotificationSpy: MockInstance<
  (
    request: SendNotificationUseCaseRequest
  ) => Promise<SendNotificationUseCaseResponse>
>;

describe('On package is at a distribution center', () => {
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

    const _onPackageIsAtADistributionCenterSendNotification =
      new OnPackageIsAtADistributionCenterSendNotification(
        packagesRepository,
        sendNotificationUseCase
      );
  });

  it('should send notification when a package arrives at a distribution center', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageRecord = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await packagesRepository.register(packageRecord);

    packageRecord.markAtDistributionCenter(deliveryPerson.id);

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith({
        title: 'Package marked at distribution center',
        content: `Your package ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        } has arrived at a distribution center. The package code is: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId.toString(),
      });
    });

    const notification = notificationsRepository.items.find(
      (item) => item.title === 'Package marked at distribution center'
    );

    expect(notification).toEqual(
      expect.objectContaining({
        title: 'Package marked at distribution center',
        content: `Your package ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        } has arrived at a distribution center. The package code is: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId,
        createdAt: expect.any(Date),
      })
    );
  });

  it('should send notification with custom description as title when provided', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageRecord = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await packagesRepository.register(packageRecord);

    const customDescription = 'Arrived at central hub';

    packageRecord.markAtDistributionCenter(
      deliveryPerson.id,
      customDescription
    );

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith(
        expect.objectContaining({
          title: customDescription,
        })
      );
    });
  });

  it('should not send notification when package does not exist', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageRecord = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    packageRecord.markAtDistributionCenter(deliveryPerson.id);

    await packagesRepository.update(packageRecord);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });
});
