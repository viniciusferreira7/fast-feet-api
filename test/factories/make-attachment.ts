import { faker } from '@faker-js/faker';

import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  Attachment,
  type AttachmentProps,
} from '@/domain/delivery/enterprise/entities/attachments';

export function makeAttachment(
  override: Partial<AttachmentProps> = {},
  id?: UniqueEntityId
) {
  return Attachment.create(
    {
      title: faker.system.fileName(),
      url: faker.internet.url(),
      ...override,
    },
    id
  );
}
