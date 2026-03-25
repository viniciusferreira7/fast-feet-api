import { faker } from '@faker-js/faker';

import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  Notification,
  type NotificationProps,
} from '@/domain/notification/enterprise/entities/notification';

export function makeNotification(
  override: Partial<NotificationProps> = {},
  id?: UniqueEntityId
) {
  return Notification.create(
    {
      recipientId: new UniqueEntityId(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      ...override,
    },
    id
  );
}
