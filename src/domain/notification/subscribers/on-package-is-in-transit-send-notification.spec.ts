import { makeAdminPerson } from 'test/factories/make-admin-person';
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
import { OnPackageIsInTransitSendNotification } from './on-package-is-in-transit-send-notification';

let packagesRepository: InMemoryPackagesRepository;
let packagesHistoryRepository: InMemoryPackagesHistoryRepository;
let notificationsRepository: InMemoryNotificationsRepository;

let sendNotificationUseCase: SendNotificationUseCase;

let sendNotificationSpy: MockInstance<
  (
    request: SendNotificationUseCaseRequest
  ) => Promise<SendNotificationUseCaseResponse>
>;

describe('On package is in transit', () => {
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

    const _onPackageIsInTransitSendNotification =
      new OnPackageIsInTransitSendNotification(
        packagesRepository,
        sendNotificationUseCase
      );
  });

  it('should send notification when a package is in transit', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      throw new Error('Failed to create at_distribution_center status');
    }

    const packageRecord = makePackage({
      status: atDistributionCenterStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    const adminPerson = makeAdminPerson();

    await packagesRepository.register(packageRecord);

    packageRecord.markAsInTransit(
      adminPerson.id,
      deliveryPerson.id,
      'Your package is now in transit'
    );

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith({
        title: 'Your package is now in transit',
        content: `A delivery person has been assigned to pick up your package ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        }. Package code: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId.toString(),
      });
    });

    const notification = notificationsRepository.items.find(
      (item) => item.title === 'Your package is now in transit'
    );

    console.log(notification);

    expect(notification).toEqual(
      expect.objectContaining({
        title: 'Your package is now in transit',
        content: `A delivery person has been assigned to pick up your package ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        }. Package code: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId,
        createdAt: expect.any(Date),
      })
    );
  });
});
