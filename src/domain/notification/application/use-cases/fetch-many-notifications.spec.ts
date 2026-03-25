import { makeNotification } from 'test/factories/make-notification';
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository';
import { Pagination } from '@/core/entities/value-object/pagination';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { FetchManyNotificationsUseCase } from './fetch-many-notifications';

let notificationsRepository: InMemoryNotificationsRepository;
let sut: FetchManyNotificationsUseCase;

describe('Fetch Many Notifications', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    sut = new FetchManyNotificationsUseCase(notificationsRepository);
  });

  it('should be able to fetch notifications by authorId', async () => {
    const authorId = new UniqueEntityId();

    await notificationsRepository.create(
      makeNotification({ recipientId: authorId })
    );
    await notificationsRepository.create(
      makeNotification({ recipientId: authorId })
    );
    await notificationsRepository.create(makeNotification());

    const result = await sut.execute({ authorId: authorId.toString() });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.notifications).toBeInstanceOf(Pagination);
      expect(result.value.notifications.result).toHaveLength(2);
    }
  });

  it('should return an empty list when no notifications exist for the author', async () => {
    const result = await sut.execute({ authorId: 'non-existent-author-id' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.notifications.result).toHaveLength(0);
    }
  });

  it('should respect pagination params', async () => {
    const authorId = new UniqueEntityId();

    for (let i = 0; i < 5; i++) {
      await notificationsRepository.create(
        makeNotification({ recipientId: authorId })
      );
    }

    const result = await sut.execute({
      authorId: authorId.toString(),
      page: 1,
      perPage: 3,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.notifications.result).toHaveLength(3);
      expect(result.value.notifications.page).toBe(1);
      expect(result.value.notifications.perPage).toBe(3);
    }
  });

  it('should return next page correctly', async () => {
    const authorId = new UniqueEntityId();

    for (let i = 0; i < 5; i++) {
      await notificationsRepository.create(
        makeNotification({ recipientId: authorId })
      );
    }

    const result = await sut.execute({
      authorId: authorId.toString(),
      page: 2,
      perPage: 3,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.notifications.result).toHaveLength(2);
      expect(result.value.notifications.page).toBe(2);
    }
  });

  it('should filter by search term across title and content', async () => {
    const authorId = new UniqueEntityId();

    await notificationsRepository.create(
      makeNotification({
        recipientId: authorId,
        title: 'Package delivery',
        content: 'Your package has arrived.',
      })
    );
    await notificationsRepository.create(
      makeNotification({
        recipientId: authorId,
        title: 'New update',
        content: 'Delivery is on the way.',
      })
    );
    await notificationsRepository.create(
      makeNotification({
        recipientId: authorId,
        title: 'Welcome',
        content: 'Thank you for signing up.',
      })
    );

    const result = await sut.execute({
      authorId: authorId.toString(),
      search: 'delivery',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.notifications.result).toHaveLength(2);
    }
  });

  it('should filter by createdAtGte', async () => {
    const authorId = new UniqueEntityId();
    const past = new Date('2024-01-01');
    const recent = new Date('2025-01-01');
    const threshold = new Date('2024-06-01');

    await notificationsRepository.create(
      makeNotification({ recipientId: authorId, createdAt: past })
    );
    await notificationsRepository.create(
      makeNotification({ recipientId: authorId, createdAt: recent })
    );

    const result = await sut.execute({
      authorId: authorId.toString(),
      createdAtGte: threshold,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.notifications.result).toHaveLength(1);
      expect(result.value.notifications.result[0].createdAt).toEqual(recent);
    }
  });
});
