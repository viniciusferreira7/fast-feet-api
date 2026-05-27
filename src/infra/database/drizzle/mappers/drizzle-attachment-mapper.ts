import type { InferSelectModel } from 'drizzle-orm';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { Attachment } from '@/domain/delivery/enterprise/entities/attachments';
import type { attachments } from '../schema';

type AttachmentRaw = InferSelectModel<typeof attachments>;

export class DrizzleAttachmentMapper {
  public static toPersistence(attachment: Attachment): AttachmentRaw {
    return {
      id: attachment.id.toString(),
      title: attachment.title,
      key: attachment.key,
    };
  }

  public static toDomain(raw: AttachmentRaw): Attachment {
    return Attachment.create(
      { title: raw.title, key: raw.key },
      new UniqueEntityId(raw.id)
    );
  }
}
