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
import { OnPackageFailedDeliverySendNotification } from './on-package-failed-delivery-send-notification';

let packagesRepository: InMemoryPackagesRepository;
let packagesHistoryRepository: InMemoryPackagesHistoryRepository;
let notificationsRepository: InMemoryNotificationsRepository;

let sendNotificationUseCase: SendNotificationUseCase;

let sendNotificationSpy: MockInstance<
  (
    request: SendNotificationUseCaseRequest
  ) => Promise<SendNotificationUseCaseResponse>
>;

describe('On package failed delivery', () => {
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

    const _onPackageFailedDeliverySendNotification =
      new OnPackageFailedDeliverySendNotification(
        packagesRepository,
        sendNotificationUseCase
      );
  });

  it('should send notification when a package delivery fails', async () => {
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

    packageRecord.markAsFailedDelivery(
      deliveryPerson.id,
      new UniqueEntityId(),
      'Recipient not home'
    );

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith({
        title: 'Recipient not home',
        content: `A delivery attempt was made for your package ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        } but was unsuccessful. Package code: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId.toString(),
      });
    });

    const notification = notificationsRepository.items.find(
      (item) => item.title === 'Recipient not home'
    );

    expect(notification).toEqual(
      expect.objectContaining({
        title: 'Recipient not home',
        content: `A delivery attempt was made for your package ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        } but was unsuccessful. Package code: ${packageRecord.code.value}`,
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

    packageRecord.markAsFailedDelivery(deliveryPerson.id, new UniqueEntityId());

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith(
        expect.objectContaining({
          title: 'Package delivery failed',
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

    packageRecord.markAsFailedDelivery(deliveryPerson.id, new UniqueEntityId());

    await packagesRepository.update(packageRecord);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });
});
