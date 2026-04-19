import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AttachmentsRepository } from '@/domain/delivery/application/repositories/attachments-repository';
import type { Attachment } from '@/domain/delivery/enterprise/entities/attachments';
import { DrizzleService } from '../drizzle.service';
import { DrizzleAttachmentMapper } from '../mappers/drizzle-attachment-mapper';
import { attachments } from '../schema';

@Injectable()
export class DrizzleAttachmentsRepository implements AttachmentsRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  public async create(attachment: Attachment): Promise<void> {
    const raw = DrizzleAttachmentMapper.toPersistence(attachment);

    await this.drizzleService.db.insert(attachments).values(raw);
  }

  public async findById(attachmentId: string): Promise<Attachment | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId));

    if (!row) return null;

    return DrizzleAttachmentMapper.toDomain(row);
  }
}
