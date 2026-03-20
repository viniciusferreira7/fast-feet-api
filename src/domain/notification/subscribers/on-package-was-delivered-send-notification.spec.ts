import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { waitFor } from 'test/utils/wait-for';
import { beforeEach, MockInstance } from 'vitest';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { PackageStatus } from '@/domain/delivery/enterprise/entities/value-object/package-status';
import {
  SendNotificationUseCase,
  SendNotificationUseCaseRequest,
  SendNotificationUseCaseResponse,
} from '../application/use-cases/send-notification';
import { OnPackageWasDeliveredSendNotification } from './on-package-was-delivered-send-notification';

let packagesRepository: InMemoryPackagesRepository;
let packagesHistoryRepository: InMemoryPackagesHistoryRepository;
let notificationsRepository: InMemoryNotificationsRepository;

let sendNotificationUseCase: SendNotificationUseCase;

let sendNotificationSpy: MockInstance<
  (
    request: SendNotificationUseCaseRequest
  ) => Promise<SendNotificationUseCaseResponse>
>;

describe('On package was delivered', () => {
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

    const _onPackageWasDeliveredSendNotification =
      new OnPackageWasDeliveredSendNotification(
        packagesRepository,
        sendNotificationUseCase
      );
  });

  it('should send notification when a package is delivered', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageRecord = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await packagesRepository.register(packageRecord);

    packageRecord.markAsDelivered(
      deliveryPerson.id,
      new UniqueEntityId(),
      'Package was delivered'
    );

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith({
        title: 'Package was delivered',
        content: `Your package ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        } has been delivered. Package code: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId.toString(),
      });
    });

    const notification = notificationsRepository.items.find(
      (item) => item.title === 'Package was delivered'
    );

    expect(notification).toEqual(
      expect.objectContaining({
        title: 'Package was delivered',
        content: `Your package ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        } has been delivered. Package code: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId,
        createdAt: expect.any(Date),
      })
    );
  });

  it('should send notification with default title when no description is provided', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageRecord = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await packagesRepository.register(packageRecord);

    packageRecord.markAsDelivered(deliveryPerson.id, new UniqueEntityId());

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith(
        expect.objectContaining({
          title: 'Package was delivered',
        })
      );
    });
  });

  it('should not send notification when package does not exist', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageRecord = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    packageRecord.markAsDelivered(deliveryPerson.id, new UniqueEntityId());

    await packagesRepository.update(packageRecord);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });
});
