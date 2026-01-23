import { makeAdminPerson } from 'test/factories/make-admin-person';
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
import { OnPackageRegisteredSendNotification } from './on-package-registered-send-notification';

let packagesRepository: InMemoryPackagesRepository;
let packagesHistoryRepository: InMemoryPackagesHistoryRepository;
let notificationsRepository: InMemoryNotificationsRepository;

let sendNotificationUseCase: SendNotificationUseCase;

let sendNotificationSpy: MockInstance<
  (
    request: SendNotificationUseCaseRequest
  ) => Promise<SendNotificationUseCaseResponse>
>;

describe('On package registered', () => {
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

    const _onPackageRegisteredSendNotification =
      new OnPackageRegisteredSendNotification(
        packagesRepository,
        sendNotificationUseCase
      );
  });

  it('should send notification when a package is registered', async () => {
    const packageRecord = makePackage({
      deliveryPersonId: null,
    });

    const adminPerson = makeAdminPerson();

    packageRecord.markAsRegistered(adminPerson.id);

    await packagesRepository.register(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith({
        title: 'Package registered',
        content: `Your package "${
          packageRecord.name.length > 20
            ? packageRecord.name.substring(0, 20).concat('...')
            : packageRecord.name
        }" has been registered successfully. Package code: ${
          packageRecord.code.value
        }`,
        recipientId: packageRecord.recipientId.toString(),
      });
    });

    const notification = notificationsRepository.items.find(
      (item) => item.title === 'Package registered'
    );

    expect(notification).toEqual(
      expect.objectContaining({
        title: 'Package registered',
        content: `Your package "${
          packageRecord.name.length > 20
            ? packageRecord.name.substring(0, 20).concat('...')
            : packageRecord.name
        }" has been registered successfully. Package code: ${
          packageRecord.code.value
        }`,
        recipientId: packageRecord.recipientId,
        createdAt: expect.any(Date),
      })
    );
  });
});
