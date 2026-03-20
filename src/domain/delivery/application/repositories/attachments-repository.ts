import type { Attachment } from '../../enterprise/entities/attachments';

export abstract class AttachmentsRepository {
  abstract create(attachment: Attachment): Promise<void>;
  abstract findById(attachmentId: string): Promise<Attachment | null>;
}
