import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { makeModuleRef } from 'test/factories/make-module-ref';
import { makeNotification } from 'test/factories/make-notification';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { RecipientPeopleRepository } from '@/domain/delivery/application/repositories/recipient-people-repository';
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import { DrizzleNotificationsRepository } from './drizzle-notifications-repository';

let app: INestApplication;
let repository: DrizzleNotificationsRepository;
let recipientRepository: RecipientPeopleRepository;

describe('DrizzleNotificationsRepository', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = moduleRef.createNestApplication();
    repository = moduleRef.get(NotificationsRepository);
    recipientRepository = moduleRef.get(RecipientPeopleRepository);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function seedRecipient() {
    const recipient = makeRecipientPerson({ emailVerification: null });
    await recipientRepository.register(recipient);

    return recipient;
  }

  describe('create', () => {
    it('should persist a notification without error', async () => {
      const recipient = await seedRecipient();
      const notification = makeNotification({ recipientId: recipient.id });

      await expect(repository.create(notification)).resolves.not.toThrow();
    });
  });

  describe('findById', () => {
    it('should return null when id does not exist', async () => {
      const result = await repository.findById(randomUUID());

      expect(result).toBeNull();
    });

    it('should return notification by id', async () => {
      const recipient = await seedRecipient();
      const notification = makeNotification({ recipientId: recipient.id });
      await repository.create(notification);

      const result = await repository.findById(notification.id.toString());

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(notification.id.toString());
    });
  });

  describe('findByIdAndAuthorId', () => {
    it('should return null when notification belongs to another recipient', async () => {
      const recipient = await seedRecipient();
      const notification = makeNotification({ recipientId: recipient.id });
      await repository.create(notification);

      const result = await repository.findByIdAndAuthorId(
        randomUUID(),
        notification.id.toString()
      );

      expect(result).toBeNull();
    });

    it('should return notification when id and authorId match', async () => {
      const recipient = await seedRecipient();
      const notification = makeNotification({ recipientId: recipient.id });
      await repository.create(notification);

      const result = await repository.findByIdAndAuthorId(
        recipient.id.toString(),
        notification.id.toString()
      );

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(notification.id.toString());
    });
  });

  describe('findManyByAuthorId', () => {
    it('should return empty pagination when recipient has no notifications', async () => {
      const result = await repository.findManyByAuthorId({
        authorId: randomUUID(),
        page: 1,
        perPage: 10,
      });

      expect(result.result).toHaveLength(0);
    });

    it('should return paginated notifications for a recipient', async () => {
      const recipient = await seedRecipient();

      await Promise.all([
        repository.create(makeNotification({ recipientId: recipient.id })),
        repository.create(makeNotification({ recipientId: recipient.id })),
        repository.create(makeNotification({ recipientId: recipient.id })),
      ]);

      const result = await repository.findManyByAuthorId({
        authorId: recipient.id.toString(),
        page: 1,
        perPage: 2,
      });

      expect(result.result).toHaveLength(2);
      expect(result.totalPages).toBe(2);
    });

    it('should filter unread notifications', async () => {
      const recipient = await seedRecipient();
      const unread = makeNotification({ recipientId: recipient.id });
      const read = makeNotification({
        recipientId: recipient.id,
        readAt: new Date(),
      });

      await Promise.all([repository.create(unread), repository.create(read)]);

      const result = await repository.findManyByAuthorId({
        authorId: recipient.id.toString(),
        isRead: false,
      });

      expect(result.result.every((n) => !n.readAt)).toBe(true);
    });
  });

  describe('save', () => {
    it('should update the readAt field on a notification', async () => {
      const recipient = await seedRecipient();
      const notification = makeNotification({ recipientId: recipient.id });
      await repository.create(notification);

      notification.read();
      await repository.save(notification);

      const result = await repository.findById(notification.id.toString());

      expect(result?.readAt).not.toBeNull();
    });
  });

  describe('markAllNotificationAsRead', () => {
    it('should mark all notifications as read for a recipient', async () => {
      const recipient = await seedRecipient();

      await Promise.all([
        repository.create(makeNotification({ recipientId: recipient.id })),
        repository.create(makeNotification({ recipientId: recipient.id })),
      ]);

      await repository.markAllNotificationAsRead(recipient.id.toString());

      const result = await repository.findManyByAuthorId({
        authorId: recipient.id.toString(),
        isRead: false,
      });

      expect(result.result).toHaveLength(0);
    });
  });
});
