import { Injectable } from '@nestjs/common';
import { and, eq, isNotNull } from 'drizzle-orm';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { PackageAttachmentsRepository } from '@/domain/delivery/application/repositories/package-attachments-repository';
import { PackageAttachment } from '@/domain/delivery/enterprise/entities/package-attachment';
import { DrizzleService } from '../drizzle.service';
import { packages } from '../schema';

@Injectable()
export class DrizzlePackageAttachmentsRepository
  implements PackageAttachmentsRepository
{
  constructor(private readonly drizzleService: DrizzleService) {}

  public async create(
    packageAttachment: PackageAttachment
  ): Promise<PackageAttachment> {
    await this.drizzleService.db
      .update(packages)
      .set({ attachmentId: packageAttachment.attachmentId.toString() })
      .where(eq(packages.id, packageAttachment.PackageId.toString()));

    return packageAttachment;
  }

  public async findById(
    packageAttachmentId: string
  ): Promise<PackageAttachment | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(packages)
      .where(
        and(
          eq(packages.id, packageAttachmentId),
          isNotNull(packages.attachmentId)
        )
      );

    if (!row?.attachmentId) return null;

    return PackageAttachment.create({
      PackageId: new UniqueEntityId(row.id),
      attachmentId: new UniqueEntityId(row.attachmentId),
    });
  }

  public async delete(
    packageAttachmentId: string
  ): Promise<PackageAttachment | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(packages)
      .where(
        and(
          eq(packages.id, packageAttachmentId),
          isNotNull(packages.attachmentId)
        )
      );

    if (!row?.attachmentId) return null;

    await this.drizzleService.db
      .update(packages)
      .set({ attachmentId: null })
      .where(eq(packages.id, packageAttachmentId));

    return PackageAttachment.create({
      PackageId: new UniqueEntityId(row.id),
      attachmentId: new UniqueEntityId(row.attachmentId),
    });
  }
}
