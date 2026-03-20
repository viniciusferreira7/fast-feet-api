import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { AttachmentsRepository } from '@/domain/delivery/application/repositories/attachments-repository';
import type { Attachment } from '@/domain/delivery/enterprise/entities/attachments';

export class InMemoryAttachmentsRepository implements AttachmentsRepository {
  public attachments: Attachment[] = [];

  async create(attachment: Attachment): Promise<void> {
    this.attachments.push(attachment);
  }

  async findById(attachmentId: string): Promise<Attachment | null> {
    return (
      this.attachments.find((a) =>
        a.id.equals(new UniqueEntityId(attachmentId))
      ) ?? null
    );
  }
}
