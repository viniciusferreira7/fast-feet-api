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
import { OnPackageWasUpdatedSendNotification } from './on-package-was-updated-send-notification';

let packagesRepository: InMemoryPackagesRepository;
let packagesHistoryRepository: InMemoryPackagesHistoryRepository;
let notificationsRepository: InMemoryNotificationsRepository;

let sendNotificationUseCase: SendNotificationUseCase;

let sendNotificationSpy: MockInstance<
  (
    request: SendNotificationUseCaseRequest
  ) => Promise<SendNotificationUseCaseResponse>
>;

describe('On package was updated', () => {
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

    const _onPackageWasUpdatedSendNotification =
      new OnPackageWasUpdatedSendNotification(
        packagesRepository,
        sendNotificationUseCase
      );
  });

  it('should send notification when a package is updated', async () => {
    const packageRecord = makePackage();

    await packagesRepository.register(packageRecord);

    packageRecord.update(
      { name: 'New name', recipientAddress: 'New address' },
      'Package details updated by admin'
    );

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith({
        title: 'Package details updated by admin',
        content: `Your package ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        }. Package code: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId.toString(),
      });
    });

    const notification = notificationsRepository.items.find(
      (item) => item.title === 'Package details updated by admin'
    );

    expect(notification).toEqual(
      expect.objectContaining({
        title: 'Package details updated by admin',
        content: `Your package ${
          packageRecord.name.length > 10
            ? packageRecord.name.substring(0, 10).concat('...')
            : packageRecord.name
        }. Package code: ${packageRecord.code.value}`,
        recipientId: packageRecord.recipientId,
        createdAt: expect.any(Date),
      })
    );
  });

  it('should send notification with default title when no description is provided', async () => {
    const packageRecord = makePackage();

    await packagesRepository.register(packageRecord);

    packageRecord.update({ name: 'New name', recipientAddress: 'New address' });

    await packagesRepository.update(packageRecord);

    await waitFor(() => {
      expect(sendNotificationSpy).toBeCalledTimes(1);
      expect(sendNotificationSpy).toBeCalledWith(
        expect.objectContaining({
          title: 'Package was updated',
        })
      );
    });
  });

  it('should not send notification when package does not exist', async () => {
    const packageRecord = makePackage();

    packageRecord.update({ name: 'New name', recipientAddress: 'New address' });

    await packagesRepository.update(packageRecord);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });
});
