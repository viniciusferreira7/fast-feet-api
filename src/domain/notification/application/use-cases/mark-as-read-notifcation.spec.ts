import { makeNotification } from 'test/factories/make-notification';
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { MarkAsReadNotificationUseCase } from './mark-as-read-notification';

let notificationsRepository: InMemoryNotificationsRepository;
let sut: MarkAsReadNotificationUseCase;

describe('Mark As Read Notification', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    sut = new MarkAsReadNotificationUseCase(notificationsRepository);
  });

  it('should be able to mark a notification as read', async () => {
    const authorId = new UniqueEntityId();
    const notification = makeNotification({ recipientId: authorId });

    await notificationsRepository.create(notification);

    const result = await sut.execute({
      authorId: authorId.toString(),
      notificationId: notification.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.notification.readAt).toBeInstanceOf(Date);
      expect(notificationsRepository.items[0].readAt).toBeInstanceOf(Date);
    }
  });

  it('should not be able to mark a notification as read when it does not exist', async () => {
    const result = await sut.execute({
      authorId: 'any-author-id',
      notificationId: 'non-existent-notification-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to mark a notification as read when it belongs to another author', async () => {
    const authorId = new UniqueEntityId();
    const otherAuthorId = new UniqueEntityId();
    const notification = makeNotification({ recipientId: authorId });

    await notificationsRepository.create(notification);

    const result = await sut.execute({
      authorId: otherAuthorId.toString(),
      notificationId: notification.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });
});
