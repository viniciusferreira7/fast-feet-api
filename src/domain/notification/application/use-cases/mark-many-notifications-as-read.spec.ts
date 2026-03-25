import { makeNotification } from 'test/factories/make-notification';
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { InvalidMarkAsReadRequestError } from './error/invalid-mark-as-read-request-error';
import { MarkManyNotificationsAsReaUseCase } from './mark-many-notifications-as-read';

let notificationsRepository: InMemoryNotificationsRepository;
let sut: MarkManyNotificationsAsReaUseCase;

describe('Mark Many Notifications As Read', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    sut = new MarkManyNotificationsAsReaUseCase(notificationsRepository);
  });

  it('should be able to mark all notifications as read', async () => {
    const authorId = new UniqueEntityId();

    await notificationsRepository.create(
      makeNotification({ recipientId: authorId })
    );
    await notificationsRepository.create(
      makeNotification({ recipientId: authorId })
    );

    const result = await sut.execute({
      authorId: authorId.toString(),
      markAll: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Notifications marked as read');
    }
    expect(notificationsRepository.items.every((n) => n.readAt != null)).toBe(
      true
    );
  });

  it('should return ResourceNotFoundError when marking all but author has no notifications', async () => {
    const result = await sut.execute({
      authorId: 'non-existent-author-id',
      markAll: true,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should be able to mark specific notifications as read when more than one id is provided', async () => {
    const authorId = new UniqueEntityId();

    await notificationsRepository.create(
      makeNotification({ recipientId: authorId })
    );
    await notificationsRepository.create(
      makeNotification({ recipientId: authorId })
    );

    const ids = notificationsRepository.items.map((n) => n.id.toString());

    const result = await sut.execute({
      authorId: authorId.toString(),
      notificationsIds: ids,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Notifications marked as read');
    }
  });

  it('should return InvalidMarkAsReadRequestError when no markAll and no notificationsIds provided', async () => {
    const result = await sut.execute({
      authorId: 'any-author-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidMarkAsReadRequestError);
    }
  });

  it('should return InvalidMarkAsReadRequestError when notificationsIds has one or fewer entries', async () => {
    const authorId = new UniqueEntityId();

    await notificationsRepository.create(
      makeNotification({ recipientId: authorId })
    );

    const result = await sut.execute({
      authorId: authorId.toString(),
      notificationsIds: [notificationsRepository.items[0].id.toString()],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidMarkAsReadRequestError);
    }
  });
});
