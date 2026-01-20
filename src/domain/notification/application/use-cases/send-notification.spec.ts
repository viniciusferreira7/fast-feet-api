import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository';
import { SendNotificationUseCase } from './send-notification';

let inMemoryNotificationRepository: InMemoryNotificationsRepository;

let sut: SendNotificationUseCase;

describe('Send notification', () => {
  beforeEach(() => {
    inMemoryNotificationRepository = new InMemoryNotificationsRepository();
    sut = new SendNotificationUseCase(inMemoryNotificationRepository);
  });

  it('should be able to send an notification', async () => {
    const result = await sut.execute({
      recipientId: '1',
      title: 'New notification',
      content: 'Content of notification',
    });

    expect(result.isRight()).toBeTruthy();
    expect(result.value?.notification.id).toBeTruthy();
    expect(inMemoryNotificationRepository.items[0]).toEqual(
      result.value?.notification
    );
  });
});
