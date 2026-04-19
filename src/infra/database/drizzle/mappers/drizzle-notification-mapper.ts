import type { InferSelectModel } from 'drizzle-orm';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { Notification } from '@/domain/notification/enterprise/entities/notification';
import type { notifications } from '../schema';

type NotificationRaw = InferSelectModel<typeof notifications>;

export class DrizzleNotificationMapper {
  public static toPersistence(notification: Notification): NotificationRaw {
    return {
      id: notification.id.toString(),
      recipientId: notification.recipientId.toString(),
      title: notification.title,
      content: notification.content,
      readAt: notification.readAt ?? null,
      createdAt: notification.createdAt,
      version: 1,
    };
  }

  public static toDomain(raw: NotificationRaw): Notification {
    return Notification.create(
      {
        recipientId: new UniqueEntityId(raw.recipientId),
        title: raw.title,
        content: raw.content,
        readAt: raw.readAt,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id)
    );
  }
}
