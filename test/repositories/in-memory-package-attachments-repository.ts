import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { PackageAttachmentsRepository } from '@/domain/delivery/application/repositories/package-attachments-repository';
import type { PackageAttachment } from '@/domain/delivery/enterprise/entities/package-attachment';

export class InMemoryPackageAttachmentsRepository
  implements PackageAttachmentsRepository
{
  public packageAttachments: PackageAttachment[] = [];

  async create(
    packageAttachment: PackageAttachment
  ): Promise<PackageAttachment> {
    this.packageAttachments.push(packageAttachment);
    return packageAttachment;
  }

  async findById(
    packageAttachmentId: string
  ): Promise<PackageAttachment | null> {
    return (
      this.packageAttachments.find((a) =>
        a.id.equals(new UniqueEntityId(packageAttachmentId))
      ) ?? null
    );
  }

  async delete(packageAttachmentId: string): Promise<PackageAttachment | null> {
    const index = this.packageAttachments.findIndex((a) =>
      a.id.equals(new UniqueEntityId(packageAttachmentId))
    );

    if (index === -1) return null;

    const [removed] = this.packageAttachments.splice(index, 1);
    return removed;
  }
}
