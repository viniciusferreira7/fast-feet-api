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

  it('should store notification with the correct recipientId', async () => {
    const result = await sut.execute({
      recipientId: 'recipient-42',
      title: 'Test title',
      content: 'Test content',
    });

    expect(result.isRight()).toBeTruthy();
    expect(result.value?.notification.recipientId.toString()).toBe(
      'recipient-42'
    );
  });

  it('should store notification with matching title and content', async () => {
    const result = await sut.execute({
      recipientId: 'any-id',
      title: 'Shipment update',
      content: 'Your package is on the way',
    });

    expect(result.isRight()).toBeTruthy();
    if (result.isRight()) {
      expect(result.value.notification.title).toBe('Shipment update');
      expect(result.value.notification.content).toBe(
        'Your package is on the way'
      );
    }
  });
});
