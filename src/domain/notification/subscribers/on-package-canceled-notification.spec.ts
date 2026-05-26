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
import { OnPackageCanceledSendNotification } from './on-package-canceled-send-notification';

let packagesRepository: InMemoryPackagesRepository;
let packagesHistoryRepository: InMemoryPackagesHistoryRepository;
let notificationsRepository: InMemoryNotificationsRepository;

let sendNotificationUseCase: SendNotificationUseCase;

let sendNotificationSpy: MockInstance<
  (
    request: SendNotificationUseCaseRequest
  ) => Promise<SendNotificationUseCaseResponse>
>;

describe('On package canceled', () => {
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

    const _onPackageCanceledSendNotification =
      new OnPackageCanceledSendNotification(
        packagesRepository,
        sendNotificationUseCase
      );
  });

  it('should send notification when a package is canceled', async () => {
    const packageRecord = makePackage({
      deliveryPersonId: null,
    });

    const adminPerson = makeAdminPerson();

    packageRecord.markAsCanceled(adminPerson.id);

    await packagesRepository.register(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith({
        title: 'Package canceled',
        content: `Your Package was canceled: ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        }, the package code is: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId.toString(),
      });
    });

    const notification = notificationsRepository.items.find(
      (item) => item.title === 'Package canceled'
    );

    expect(notification).toEqual(
      expect.objectContaining({
        title: 'Package canceled',
        content: `Your Package was canceled: ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        }, the package code is: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId,
        createdAt: expect.any(Date),
      })
    );
  });

  it('should NOT send notification when package is registered without cancellation', async () => {
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

    const adminPerson = makeAdminPerson();
    packageRecord.markAsCanceled(adminPerson.id);

    await packagesRepository.register(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
    });

    const [callArg] = sendNotificationSpy.mock.calls[0];
    expect(callArg.content).toContain('VeryLongPa...');
  });

  it('should fire exactly once per cancellation', async () => {
    const packageRecord = makePackage({ deliveryPersonId: null });
    const adminPerson = makeAdminPerson();
    packageRecord.markAsCanceled(adminPerson.id);

    await packagesRepository.register(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
    });

    expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
  });
});
